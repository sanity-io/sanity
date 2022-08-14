import {SanityClient} from '@sanity/client'
import {defer, partition, merge, of, throwError, asyncScheduler, Observable} from 'rxjs'
import {mergeMap, throttleTime, share, take, filter} from 'rxjs/operators'
import {exhaustMapToWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {ReconnectEvent, WelcomeEvent, MutationEvent} from './types'

export type ListenQueryParams = Record<string, string | number | boolean | string[]>

export interface ListenQueryOptions {
  tag?: string
  apiVersion?: string
  throttleTime?: number
  transitions?: ('update' | 'appear' | 'disappear')[]
}

const fetch = (
  client: SanityClient,
  query: string,
  params: ListenQueryParams,
  options: ListenQueryOptions
) =>
  defer(() =>
    // getVersionedClient(options.apiVersion)
    client.observable.fetch(query, params, {
      tag: options.tag,
      filterResponse: true,
    })
  )

const listen = (
  client: SanityClient,
  query: string,
  params: ListenQueryParams,
  options: ListenQueryOptions
) =>
  defer(() =>
    // getVersionedClient(options.apiVersion)
    client.listen(query, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false,
      visibility: 'query',
      tag: options.tag,
    })
  ) as Observable<ReconnectEvent | WelcomeEvent | MutationEvent>

function isWelcomeEvent(
  event: MutationEvent | ReconnectEvent | WelcomeEvent
): event is WelcomeEvent {
  return event.type === 'welcome'
}

// todo: promote as building block for better re-use
// todo: optimize by patching collection in-place
export const listenQuery = (
  client: SanityClient,
  query: string | {fetch: string; listen: string},
  params: ListenQueryParams = {},
  options: ListenQueryOptions = {}
) => {
  const fetchQuery = typeof query === 'string' ? query : query.fetch
  const listenerQuery = typeof query === 'string' ? query : query.listen

  const fetchOnce$ = fetch(client, fetchQuery, params, options)

  const events$ = listen(client, listenerQuery, params, options).pipe(
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
  const isRelevantEvent = (event: MutationEvent | ReconnectEvent | WelcomeEvent): boolean => {
    if (!options.transitions || event.type !== 'mutation') {
      return true
    }

    return options.transitions.includes(event.transition)
  }

  return merge(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(
      filter(isRelevantEvent),
      throttleTime(options.throttleTime || 1000, asyncScheduler, {leading: true, trailing: true})
    )
  ).pipe(exhaustMapToWithTrailing(fetchOnce$))
}
