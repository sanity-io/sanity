import {type LiveEvent, type LiveEventMessage} from '@sanity/client'
import {useDeferredValue, useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {catchError, scan, throwError} from 'rxjs'
import {type SanityClient} from 'sanity'

/**
 * Upper bound on retained messages. Only the most recent sync tags are useful for refetching,
 * and the list would otherwise grow for the lifetime of the connection.
 */
const MAX_BUFFERED_MESSAGES = 100

type State = {
  /**
   * List over the most recent live events with Sync Tags, capped at `MAX_BUFFERED_MESSAGES`,
   * that can be used to refetch with Sanity Client, using the id as the lastLiveEventId parameter
   */
  messages: LiveEventMessage[]
  /**
   * If the connection experiences a reconnect, or a restart event is received, the counter is incremented.
   * This counter is suitable as a `key` on React Components as a way to reset its internal state and refetch.
   */
  resets: number
}

export function reducer(state: State, event: LiveEvent): State {
  switch (event.type) {
    case 'message':
      return {
        ...state,
        messages: [...state.messages, event].slice(-MAX_BUFFERED_MESSAGES),
      }
    case 'reconnect':
    case 'restart':
      return {
        ...state,
        messages: [],
        resets: state.resets + 1,
      }
    case 'welcome':
      // no-op
      return state
    default:
      throw Error(
        `Unknown event: ${
          // oxlint-disable-next-line no-explicit-any
          (event as any).type
        }`,
        {cause: event},
      )
  }
}

export const initialState: State = {
  messages: [],
  resets: 0,
}

export function useLiveEvents(client: SanityClient): State {
  const state$ = useMemo(
    () =>
      client.live.events({includeDrafts: true, tag: 'presentation-loader'}).pipe(
        scan(reducer, initialState),
        // Normalize non-Error failures so the error boundary always receives
        // an Error with the original throwable as `cause`.
        catchError((err) =>
          throwError(() =>
            err instanceof Error
              ? err
              : new Error('Unexpected error in useLiveEvents', {cause: err}),
          ),
        ),
      ),
    [client.live],
  )

  // Stream errors are re-thrown by `useSyncObservable` during render, so they reach the nearest
  // error boundary without any explicit handling here.
  return useDeferredValue(useSyncObservable(state$, initialState))
}
