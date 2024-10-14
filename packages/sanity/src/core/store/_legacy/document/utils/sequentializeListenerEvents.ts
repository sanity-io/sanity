import {partition} from 'lodash'
import {concat, type Observable, of, switchMap, throwError, timer} from 'rxjs'
import {mergeMap, scan} from 'rxjs/operators'

import {debug} from '../debug'
import {type ListenerEvent} from '../getPairListener'
import {type MutationEvent} from '../types'
import {discardChainTo, toOrderedChains} from './eventChainUtils'

interface ListenerSequenceState {
  /**
   * Tracks the latest revision from the server that can be applied locally
   * Once we receive a mutation event that has a `previousRev` that equals `base.revision`
   * we will move `base.revision` to the event's `resultRev`
   * `base.revision` will be undefined if document doesn't exist.
   * `base` is `undefined` until the snapshot event is received
   */
  base: {revision: string | undefined} | undefined
  /**
   * Array of events to pass on to the stream, e.g. when mutation applies to current head revision, or a chain is complete
   */
  emitEvents: ListenerEvent[]
  /**
   * Buffer to keep track of events that doesn't line up in a [previousRev, resultRev] -- [previousRev, resultRev] sequence
   * This can happen if events arrive out of order, or if an event in the middle for some reason gets lost
   */
  buffer: MutationEvent[]
}

const DEFAULT_MAX_BUFFER_SIZE = 20
const DEFAULT_DEADLINE_MS = 30000

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
  resolveChainDeadline?: number
}) {
  const {resolveChainDeadline = DEFAULT_DEADLINE_MS, maxBufferSize = DEFAULT_MAX_BUFFER_SIZE} =
    options || {}

  return (input$: Observable<ListenerEvent>): Observable<ListenerEvent> => {
    return input$.pipe(
      scan(
        (state: ListenerSequenceState, event: ListenerEvent): ListenerSequenceState => {
          if (event.type === 'mutation' && !state.base) {
            throw new Error('Invalid state. Cannot create a sequence without a base')
          }
          if (event.type === 'snapshot') {
            // When receiving a new snapshot, we can safely discard the current orphaned and chainable buffers
            return {
              base: {revision: event.document?._rev},
              buffer: EMPTY_ARRAY,
              emitEvents: [event],
            }
          }

          if (event.type === 'mutation') {
            // Note: the buffer may have multiple holes in it (this is a worst case scenario, and probably not likely, but still),
            // so we need to consider all possible chains
            // `toOrderedChains` will return all detected chains and each of the returned chains will be orderered
            // Once we have a list of chains, we can then discard any chain that leads up to the current revision
            // since they are already applied on the document
            const orderedChains = toOrderedChains(state.buffer.concat(event)).map((chain) => {
              // in case the chain leads up to the current revision
              const [discarded, rest] = discardChainTo(chain, state.base!.revision)
              if (discarded.length > 0) {
                debug('Discarded %d mutations already applied to document', discarded.length)
              }
              return rest
            })

            const [applicableChains, _nextBuffer] = partition(orderedChains, (chain) => {
              // note: there can be at most one applicable chain
              return state.base!.revision === chain[0]?.previousRev
            })

            const nextBuffer = _nextBuffer.flat()
            if (applicableChains.length > 1) {
              throw new Error('Expected at most one applicable chain')
            }
            if (applicableChains.length > 0 && applicableChains[0].length > 0) {
              // we now have a continuous chain that can apply on the base revision
              // Move current base revision to the last mutation event in the applicable chain
              const lastMutation = applicableChains[0].at(-1)!
              const nextBaseRevision =
                // special case: if the mutation deletes the document it technically has  no revision, despite
                // resultRev pointing at a transaction id.
                lastMutation.transition === 'disappear' ? undefined : lastMutation?.resultRev
              return {
                base: {revision: nextBaseRevision},
                emitEvents: applicableChains[0],
                buffer: nextBuffer,
              }
            }

            if (
              nextBuffer.length >=
              ((globalThis as any).__sanity_debug_maxBufferSize ?? maxBufferSize)
            ) {
              throw new MaxBufferExceededError(
                `Too many unchainable mutation events: ${state.buffer.length}`,
                state,
              )
            }
            return {
              ...state,
              buffer: nextBuffer,
              emitEvents: EMPTY_ARRAY,
            }
          }
          // Any other event (e.g. 'reconnect' is passed on verbatim)
          return {...state, emitEvents: [event]}
        },
        {
          emitEvents: EMPTY_ARRAY,
          base: undefined,
          buffer: EMPTY_ARRAY,
        },
      ),
      switchMap((state) => {
        const deadline =
          (globalThis as any).__sanity_debug_resolveChainDeadline ?? resolveChainDeadline

        if (state.buffer.length > 0) {
          debug(
            "Detected %d listener event(s) that can't be applied in sequence. This could be due to events arriving out of order. Will throw an error if chain can't be resolved within %dms",
            state.buffer.length,
            deadline,
          )
          return concat(
            of(state),
            timer(deadline).pipe(
              mergeMap(() =>
                throwError(() => {
                  return new DeadlineExceededError(
                    `Did not resolve chain within a deadline of ${resolveChainDeadline}ms`,
                    state,
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

export class OutOfSyncError extends Error {
  /**
   * Attach state to the error for debugging/reporting
   */
  state: ListenerSequenceState
  constructor(message: string, state: ListenerSequenceState) {
    super(message)
    this.name = 'OutOfSyncError'
    this.state = state
  }
}

export class DeadlineExceededError extends OutOfSyncError {
  constructor(message: string, state: ListenerSequenceState) {
    super(message, state)
    this.name = 'DeadlineExceededError'
  }
}
export class MaxBufferExceededError extends OutOfSyncError {
  constructor(message: string, state: ListenerSequenceState) {
    super(message, state)
    this.name = 'MaxBufferExceededError'
  }
}
