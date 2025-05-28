import {type LiveEvent, type LiveEventMessage} from '@sanity/client'
import {useDeferredValue, useEffect, useReducer, useState} from 'react'
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [state, dispatch] = useReducer(reducer, initialState)
  const [error, setError] = useState<unknown>(null)
  if (error !== null) {
    // Push error to nearest error boundary
    throw error
  }

  useEffect(() => {
    const subscription = client.live
      .events({includeDrafts: true, tag: 'presentation-loader'})
      .subscribe({
        next: dispatch,
        error: (err) =>
          setError(
            err instanceof Error
              ? err
              : new Error('Unexpected error in useLiveEvents', {cause: err}),
          ),
      })
    return () => subscription.unsubscribe()
  }, [client.live])

  return useDeferredValue(state)
}
