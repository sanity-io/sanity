import {SanityClient} from '@sanity/client'
import {asyncScheduler, defer, merge, Observable, of, partition, throwError, timer} from 'rxjs'
import {filter, mergeMap, share, take, throttleTime} from 'rxjs/operators'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {MutationEvent, ReconnectEvent, WelcomeEvent} from './types'

/** @internal */
export type ListenQueryParams = Record<string, string | number | boolean | string[]>

/**
 * @hidden
 * @beta */
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

/** @internal */
export function listenQuery(
  client: SanityClient,
  query: string | {fetch: string; listen: string},
  params: ListenQueryParams = {},
  options: ListenQueryOptions = {}
): Observable<any> {
  const fetchQuery = typeof query === 'string' ? query : query.fetch
  const listenerQuery = typeof query === 'string' ? query : query.listen

  const events$ = listen(client, listenerQuery, params, options).pipe(
    mergeMap((ev, i) => {
      const isFirst = i === 0
      if (isFirst && !isWelcomeEvent(ev)) {
        // if the first event is not welcome, it is most likely a reconnect and
        // if it's not a reconnect something is very wrong
        return throwError(
          () =>
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

  const doFetch = () => fetch(client, fetchQuery, params, options)

  return merge(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(
      filter(isRelevantEvent),
      throttleTime(options.throttleTime || 1000, asyncScheduler, {leading: true, trailing: true})
    )
  ).pipe(
    exhaustMapWithTrailing((event) => {
      if (event.type === 'mutation' && event.visibility !== 'query') {
        // Even though the listener request specifies visibility=query, the events are not guaranteed to be delivered with visibility=query
        // If the event we are responding to arrives with visibility != query, we add a little delay to allow for the updated document to be available for queries
        // See https://www.sanity.io/docs/listening#visibility-c4786e55c3ff
        return timer(1200).pipe(mergeMap(doFetch))
      }
      return doFetch()
    })
  )
}
