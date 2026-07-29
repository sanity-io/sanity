import {type LiveEvent, type LiveEventMessage} from '@sanity/client'
import {useDeferredValue, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of, scan} from 'rxjs'
import {type SanityClient} from 'sanity'

type State = {
  /**
   * Growing list over live events with Sync Tags,
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
        messages: [...state.messages, event],
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

type LiveEventsResult = {type: 'value'; state: State} | {type: 'error'; error: unknown}

const INITIAL_RESULT: LiveEventsResult = {type: 'value', state: initialState}

export function useLiveEvents(client: SanityClient): State {
  const state$ = useMemo(
    () =>
      client.live.events({includeDrafts: true, tag: 'presentation-loader'}).pipe(
        scan(reducer, initialState),
        map((state): LiveEventsResult => ({type: 'value', state})),
        catchError((err: unknown) =>
          of({
            type: 'error' as const,
            error:
              err instanceof Error
                ? err
                : new Error('Unexpected error in useLiveEvents', {cause: err}),
          }),
        ),
      ),
    [client.live],
  )

  const result = useObservable(state$, INITIAL_RESULT)
  if (result.type === 'error') {
    throw result.error
  }

  return useDeferredValue(result.state)
}
