/* eslint-disable no-console */
import {concat, type Observable, of, switchMap, throwError, timer} from 'rxjs'
import {mergeMap, scan} from 'rxjs/operators'

import {type ListenerEventWithSnapshot} from '../getPairListener'
import {type MutationEvent} from '../types'
import {discardChainTo, linkedSort} from './eventChainUtils'

interface DocumentMutationSequenceState {
  /**
   * Base revision will be undefined if document doesn't exist
   */
  baseRevision: string | undefined
  /**
   * Array of events to pass on to the stream, e.g. when mutation applies to current head revision, or a chain is complete
   */
  emitEvents: ListenerEventWithSnapshot[]
  /**
   * Buffer to keep track of events that doesn't line up in a [previousRev, resultRev] -- [previousRev, resultRev] sequence
   * This can happen if events arrive out of order, or if an event in the middle for some reason gets lost
   */
  buffer: MutationEvent[]
}

export class OutOfSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OutOfSyncError'
  }
}

const DEFAULT_MAX_BUFFER_SIZE = 10
const DEFAULT_DEADLINE_MS = 3000

const EMPTY_ARRAY: never[] = []

/**
 * Takes an input observable of listener events that might arrive out of order, and emits them in sequence
 * If we receive mutation events that doesn't line up in [previousRev, resultRev] pairs we'll put them in a buffer and
 * check if we have an unbroken chain every time we receive a new event
 *
 * If the buffer grows beyond `maxBufferSize`, or if `resolveChainDeadline` milliseconds passes before the chain resolves
 * an OutOfSyncError will be thrown on the stream
 *
 * @internal
 */
export function sequentializeListenerEvents(options?: {
  maxBufferSize?: number
  resolveChainDeadline: number
}) {
  const {resolveChainDeadline = DEFAULT_DEADLINE_MS, maxBufferSize = DEFAULT_MAX_BUFFER_SIZE} =
    options || {}

  return (input$: Observable<ListenerEventWithSnapshot>): Observable<ListenerEventWithSnapshot> => {
    return input$.pipe(
      scan(
        (
          state: DocumentMutationSequenceState,
          event: ListenerEventWithSnapshot,
        ): DocumentMutationSequenceState => {
          if (event.type === 'mutation' && !state.baseRevision) {
            throw new Error('Invalid state. Cannot create a sequence without a base')
          }
          if (event.type === 'snapshot') {
            // When receiving a new snapshot, we can safely discard the current orphaned and chainable buffers
            return {
              baseRevision: event.initialRevision,
              buffer: EMPTY_ARRAY,
              emitEvents: [event],
            }
          }

          if (event.type === 'mutation') {
            const sortedBuffer = linkedSort(state.buffer.concat(event))

            // Discard any mutation events that leads up to the base revision
            const [discarded, nextBuffer] = discardChainTo(sortedBuffer, state.baseRevision)

            if (discarded.length > 0) {
              console.log('DISCARDED MUTATIONS ALREADY APPLIED IN DOCUMENT', discarded)
            }

            if (nextBuffer.length === 0) {
              return {...state, emitEvents: EMPTY_ARRAY, buffer: EMPTY_ARRAY}
            }

            if (nextBuffer[0].previousRev === state.baseRevision) {
              // we have a continuous chain and can now flush the buffer
              const nextBase = nextBuffer.at(-1)?.resultRev
              return {
                ...state,
                baseRevision: nextBase,
                emitEvents: nextBuffer,
                buffer: EMPTY_ARRAY,
              }
            }
            if (state.buffer.length >= maxBufferSize) {
              throw new OutOfSyncError(
                `Too many unchainable mutation events: ${state.buffer.length}`,
              )
            }
            return {
              ...state,
              buffer: state.buffer.concat(event),
              emitEvents: EMPTY_ARRAY,
            }
          }
          // Any other event (e.g. 'reconnect' is passed on verbatim)
          return {...state, emitEvents: [event]}
        },
        {
          emitEvents: EMPTY_ARRAY,
          baseRevision: undefined,
          buffer: EMPTY_ARRAY,
        },
      ),
      switchMap((state) => {
        if (state.buffer.length > 0) {
          return concat(
            of(state),
            timer(resolveChainDeadline).pipe(
              mergeMap(() =>
                throwError(() => {
                  return new OutOfSyncError(
                    `Did not resolve chain within a deadline of ${resolveChainDeadline}ms`,
                  )
                }),
              ),
            ),
          )
        }
        return of(state)
      }),
      mergeMap((state) => {
        // this will simply flatten the list of events into individual emissions
        // if the flushEvents array is empty, nothing will be emitted
        return state.emitEvents
      }),
    )
  }
}
