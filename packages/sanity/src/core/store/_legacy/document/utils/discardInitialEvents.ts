/* eslint-disable no-console */
import {type Observable} from 'rxjs'
import {filter, map, scan} from 'rxjs/operators'

import {type ListenerEvent} from '../getPairListener'
import {type MutationEvent} from '../types'
import {discardChainTo} from './eventChainUtils'

type State = {
  consistent: boolean
  event: ListenerEvent | undefined
  initialSnapshot: {revision: string | undefined} | undefined
  pending: MutationEvent[]
}

/**
 * Assumes events are received in sequence
 * TODO: DELETE NOT IN USE
 */
export function discardInitialMutationEvents() {
  return (input$: Observable<ListenerEvent>): Observable<ListenerEvent> => {
    return input$.pipe(
      scan(
        (state: State, event: ListenerEvent): State => {
          if (event.type === 'mutation' && !state.initialSnapshot) {
            throw new Error(
              'Invalid state. Initial snapshot must always be set before accepting any mutation event',
            )
          }
          if (event.type === 'snapshot') {
            // When receiving a new snapshot, we can safely discard the current orphaned and chainable buffers
            return {
              consistent: false,
              initialSnapshot: {
                // note: the document may not exist
                revision: event.document?._rev,
              },
              pending: [],
              event,
            }
          }

          if (!state.consistent && event.type === 'mutation') {
            // Common case: the first mutation we receive builds upon the revision of the document as we received it
            if (event.previousRev === state.initialSnapshot?.revision) {
              console.log('All good')
              return {
                ...state,
                consistent: true,
                event: event,
                pending: [],
              }
            }
            // if it doesn't build on the current document snapshot revision
            if (
              !state.consistent &&
              state.initialSnapshot?.revision &&
              event.previousRev !== state.initialSnapshot?.revision
            ) {
              // If we get here we are dealing with events that happened before we fetched the snapshot. These mutations are already applied to the current snapshot
              const [discarded, pendingWithDiscarded] = discardChainTo(
                state.pending.concat(event),
                state.initialSnapshot.revision,
              )

              if (discarded.length > 0) {
                console.log('DISCARDED MUTATIONS THAT HAPPENED BEFORE INITIAL SNAPSHOT')
              }

              return {
                ...state,
                consistent: pendingWithDiscarded.length === 0,
                // signal that the event should not be passed on
                event: undefined,
                pending: pendingWithDiscarded,
              }
            }
          }
          return {...state, event}
        },
        {
          event: undefined,
          initialSnapshot: undefined,
          pending: [],
          consistent: false,
        } satisfies State,
      ),
      map((state) => state?.event),
      filter((event) => event !== undefined),
    )
  }
}
