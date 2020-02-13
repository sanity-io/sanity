import client from 'part:@sanity/base/client'
import {defer, merge, of, throwError, asyncScheduler} from 'rxjs'
import {mergeMap, partition, throttleTime, share, switchMapTo, take} from 'rxjs/operators'

const fetch = (query, params) => defer(() => client.observable.fetch(query, params))
const listen = (query, params) =>
  defer(() =>
    client.listen(query, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false,
      visibility: 'query'
    })
  )

// todo: promote as building block for better re-use
// todo: optimize by patching collection in-place
export const listenQuery = (query, params) => {
  const fetchOnce$ = fetch(query, params)

  const [welcome$, mutation$] = listen(query, params).pipe(
    mergeMap((ev, i) => {
      const isFirst = i === 0
      const isWelcome = ev.type === 'welcome'
      if (isFirst && !isWelcome) {
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
    share(),
    partition(ev => ev.type === 'welcome')
  )

  return merge(
    welcome$.pipe(take(1)),
    mutation$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true}))
  ).pipe(switchMapTo(fetchOnce$))
}
