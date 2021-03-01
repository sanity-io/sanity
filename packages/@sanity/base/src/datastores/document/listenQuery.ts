import client from 'part:@sanity/base/client'
import {defer, partition, merge, of, throwError, asyncScheduler, Observable} from 'rxjs'
import {mergeMap, throttleTime, share, switchMapTo, take} from 'rxjs/operators'

import {ReconnectEvent, WelcomeEvent} from './types'

const fetch = (query: string, params: {}) => defer(() => client.observable.fetch(query, params))

const listen = (query: string, params: {}) =>
  defer(() =>
    client.listen(query, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false,
      visibility: 'query',
    })
  ) as Observable<ReconnectEvent | WelcomeEvent | MutationEvent>

function isWelcomeEvent(
  event: MutationEvent | ReconnectEvent | WelcomeEvent
): event is WelcomeEvent {
  return event.type === 'welcome'
}

// todo: promote as building block for better re-use
// todo: optimize by patching collection in-place
export const listenQuery = (query: string, params: {}) => {
  const fetchOnce$ = fetch(query, params)

  const events$ = listen(query, params).pipe(
    mergeMap((ev, i) => {
      const isFirst = i === 0
      if (isFirst && !isWelcomeEvent(ev)) {
        // if the first event is not welcome, it is most likely a reconnect and
        // if it's not a reconnect something is very wrong
        return throwError(
          new Error(
            ev.type === 'reconnect'
              ? 'Could not establish EventSource connection'
              : `Received unexpected type of first event "${ev.type}"`
          )
        )
      }
      return of(ev)
    }),
    share()
  )

  const [welcome$, mutationAndReconnect$] = partition(events$, isWelcomeEvent)

  return merge(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true}))
  ).pipe(switchMapTo(fetchOnce$))
}
