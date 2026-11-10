import {type ClientPerspective, type SanityClient} from '@sanity/client'
import {asyncScheduler, defer, merge, type Observable, of, partition, throwError, timer} from 'rxjs'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {filter, mergeMap, share, throttleTime} from 'rxjs/operators'

import {versionedClient} from '../../studioClient'
import {reconnectListener} from '../../util/reconnectListener'
import {variantApiVersion} from '../../variants/util/variantApiVersion'
import {type MutationEvent, type ReconnectEvent, type WelcomeEvent} from './types'

/** @internal */
export type ListenQueryParams = Record<string, string | number | boolean | string[]>

/**
 * @hidden
 * @beta */
export interface ListenQueryOptions {
  tag?: string
  apiVersion?: string
  perspective?: ClientPerspective
  /**
   * The selected editing variant as a bare variant id. When set, documents are resolved as seen
   * through that variant, on top of `perspective`.
   */
  variant?: string
  throttleTime?: number
  transitions?: ('update' | 'appear' | 'disappear')[]
}

const fetch = (
  client: SanityClient,
  query: string,
  params: ListenQueryParams,
  options: ListenQueryOptions,
) =>
  defer(() =>
    versionedClient(client, variantApiVersion(options.variant)).observable.fetch(query, params, {
      tag: options.tag,
      filterResponse: true,
      perspective: options.perspective,
      variant: options.variant,
    }),
  )

const listen = (
  client: SanityClient,
  query: string,
  params: ListenQueryParams,
  options: ListenQueryOptions,
) =>
  defer(() =>
    client.listen(query, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false,
      visibility: 'query',
      includeAllVersions: true,
      tag: options.tag,
    }),
  ).pipe(reconnectListener()) as Observable<ReconnectEvent | WelcomeEvent | MutationEvent>

/**
 * The listener failed before it welcomed: the query is fetched for it as it is for `welcome`, and
 * fetched again once the listener welcomes.
 */
const LISTENER_UNAVAILABLE = {type: 'unavailable'} as const

type ListenQueryEvent = MutationEvent | ReconnectEvent | WelcomeEvent | typeof LISTENER_UNAVAILABLE

function isFetchTrigger(
  event: ListenQueryEvent,
): event is WelcomeEvent | typeof LISTENER_UNAVAILABLE {
  return event.type === 'welcome' || event.type === 'unavailable'
}

/** @internal */
export function listenQuery(
  client: SanityClient,
  query: string | {fetch: string; listen: string},
  params: ListenQueryParams = {},
  options: ListenQueryOptions = {},
): Observable<any> {
  const fetchQuery = typeof query === 'string' ? query : query.fetch
  const listenerQuery = typeof query === 'string' ? query : query.listen

  const events$ = listen(client, listenerQuery, params, options).pipe(
    mergeMap((ev, i): Observable<ListenQueryEvent> => {
      if (i > 0 || ev.type === 'welcome') {
        return of(ev)
      }
      // A reconnect before welcome means the listener could not connect
      if (ev.type === 'reconnect') {
        return of(LISTENER_UNAVAILABLE)
      }
      // if the first event is neither welcome nor reconnect, something is very wrong
      return throwError(() => new Error(`Received unexpected type of first event "${ev.type}"`))
    }),
    share(),
  )

  const [fetchTriggers$, mutationAndReconnect$] = partition(events$, isFetchTrigger)
  const isRelevantEvent = (event: ListenQueryEvent): boolean => {
    if (!options.transitions || event.type !== 'mutation') {
      return true
    }

    return options.transitions.includes(event.transition)
  }

  const doFetch = () => fetch(client, fetchQuery, params, options)

  return merge(
    // Every `welcome` refetches: a listener that welcomes again after a reconnect has missed the
    // mutations made while it was disconnected.
    fetchTriggers$,
    mutationAndReconnect$.pipe(
      filter(isRelevantEvent),
      throttleTime(options.throttleTime || 1000, asyncScheduler, {leading: true, trailing: true}),
    ),
  ).pipe(
    exhaustMapWithTrailing((event) => {
      if (event.type === 'mutation' && event.visibility !== 'query') {
        // Even though the listener request specifies visibility=query, the events are not guaranteed to be delivered with visibility=query
        // If the event we are responding to arrives with visibility != query, we add a little delay to allow for the updated document to be available for queries
        // See https://www.sanity.io/docs/listening#visibility-c4786e55c3ff
        return timer(1200).pipe(mergeMap(doFetch))
      }
      return doFetch()
    }),
  )
}
