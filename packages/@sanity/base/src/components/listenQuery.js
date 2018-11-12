import client from 'part:@sanity/base/client'
import {auditTime, take, share, filter, mergeMap, switchMapTo} from 'rxjs/operators'
import {defer, concat, throwError} from 'rxjs'

const fetch = (query, params) => defer(() => client.observable.fetch(query, params))
const listen = (query, params) =>
  defer(() =>
    client.listen(query, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false
    })
  )

// todo: promote as building block for better re-use
// todo: optimize by patching collection in-place
export const listenQuery = (query, params) => {
  const fetchOnce$ = fetch(query, params)

  const events$ = listen(query, params).pipe(share())
  const mutations$ = events$.pipe(filter(ev => ev.type === 'mutation'))

  return concat(
    events$.pipe(
      mergeMap(first => {
        if (first.type === 'welcome') {
          return fetchOnce$
        }
        return throwError(
          new Error(
            first.type === 'reconnect'
              ? // if the first event is not welcome, it is most likely a reconnect and
                'Could not establish EventSource connection'
              : // if it's not a reconnect something is very wrong
                `Received unexpected type of first event "${first.type}"`
          )
        )
      }),
      take(1)
    ),
    mutations$.pipe(
      auditTime(1000),
      switchMapTo(fetchOnce$)
    )
  )
}
