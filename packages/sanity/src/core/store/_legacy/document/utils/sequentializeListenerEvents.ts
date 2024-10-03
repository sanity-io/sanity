/* eslint-disable no-console */
import {concat, from, type Observable, of, switchMap, throwError, timer} from 'rxjs'
import {mergeMap, scan} from 'rxjs/operators'

import {type ListenerEventWithSnapshot} from '../getPairListener'
import {type MutationEvent} from '../types'
import {discardChainTo, linkedSort} from './eventChainUtils'

type State = {
  base: {revision: string | undefined} | undefined
  events: ListenerEventWithSnapshot[] | undefined
  buffer: MutationEvent[]
  initialSnapshotRevision: string | undefined
}

export class OutOfSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OutOfSyncError'
  }
}

const DEFAULT_MAX_BUFFER_SIZE = 10
const DEFAULT_DEADLINE_MS = 3000

/**
 * Takes an observable of listener events that might arrive out of order, and emits them in sequence
 * TODO: support a threshold for when to give up
 */
export function sequentializeListenerEvents(options?: {
  maxBufferSize?: number
  brokenChainDeadline: number
}) {
  const {brokenChainDeadline = DEFAULT_DEADLINE_MS, maxBufferSize = DEFAULT_MAX_BUFFER_SIZE} =
    options || {}

  return (input$: Observable<ListenerEventWithSnapshot>): Observable<ListenerEventWithSnapshot> => {
    return input$.pipe(
      scan(
        (state: State, event: ListenerEventWithSnapshot): State => {
          if (event.type === 'mutation' && !state.base) {
            throw new Error('Invalid state. Cannot create a sequence without a base')
          }
          if (event.type === 'snapshot') {
            // When receiving a new snapshot, we can safely discard the current orphaned and chainable buffers
            return {
              base: {
                // note: the document may not exist, in that case initialRevision will be undefined
                revision: event.initialRevision,
              },
              initialSnapshotRevision: event.initialRevision,
              buffer: [],
              events: [event],
            }
          }

          if (event.type === 'mutation') {
            const sortedBuffer = linkedSort(state.buffer.concat(event))

            if (sortedBuffer[0].previousRev === state.base?.revision) {
              // we have a continuous chain
              const nextBase = sortedBuffer.at(-1)?.resultRev
              const [discarded, nextBuffer] = discardChainTo(
                sortedBuffer,
                state.initialSnapshotRevision!,
              )

              if (discarded.length > 0) {
                console.log('DISCARDED MUTATIONS ALREADY APPLIED IN DOCUMENT', discarded)
              }
              // we can now flush the buffer
              return {
                ...state,
                base: {revision: nextBase},
                events: nextBuffer,
                buffer: [],
              }
            }
            // todo: add a time threshold too
            if (state.buffer.length >= maxBufferSize) {
              console.log('STATE', state)
              throw new OutOfSyncError(
                `Too many unchainable mutation events: ${state.buffer.length}`,
              )
            }
            return {
              ...state,
              buffer: state.buffer.concat(event),
              events: [],
            }
          }
          return {...state, events: [event]}
        },
        {
          events: [],
          base: undefined,
          buffer: [],
          initialSnapshotRevision: undefined,
        } satisfies State,
      ),
      switchMap((state) => {
        if (state.buffer.length > 0) {
          return concat(
            of(state),
            timer(brokenChainDeadline).pipe(
              mergeMap(() =>
                throwError(() => {
                  console.log('STATE', state)

                  return new OutOfSyncError(
                    `Did not close chain within due time: ${brokenChainDeadline}`,
                  )
                }),
              ),
            ),
          )
        }
        return of(state)
      }),
      mergeMap((state) => {
        return from(state?.events || [])
      }),
    )
  }
}
