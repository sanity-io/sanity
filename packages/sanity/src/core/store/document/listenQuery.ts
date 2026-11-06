import {type ClientPerspective, type SanityClient} from '@sanity/client'
import {asyncScheduler, defer, merge, type Observable, of, partition, throwError, timer} from 'rxjs'
import {exhaustMapWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {filter, mergeMap, share, take, throttleTime} from 'rxjs/operators'

import {type InvalidationChannelEvent} from '../../preview/types'
import {versionedClient} from '../../studioClient'
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
  ) as Observable<ReconnectEvent | WelcomeEvent | MutationEvent>

function isWelcomeEvent(
  event: MutationEvent | ReconnectEvent | WelcomeEvent,
): event is WelcomeEvent {
  return event.type === 'welcome'
}

const DEFAULT_THROTTLE_TIME = 1000

type FetchTrigger = WelcomeEvent | ReconnectEvent | MutationEvent | InvalidationChannelEvent

/**
 * Fetches on every `immediate$` event, and on `throttled$` events at most once per `throttleMs`
 * (leading and trailing). One fetch runs at a time: events that arrive during a fetch queue one
 * more after it.
 */
function fetchOnEvents<Result>(
  immediate$: Observable<FetchTrigger>,
  throttled$: Observable<FetchTrigger>,
  doFetch: () => Observable<Result>,
  throttleMs: number,
): Observable<Result> {
  return merge(
    immediate$,
    throttled$.pipe(throttleTime(throttleMs, asyncScheduler, {leading: true, trailing: true})),
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
                : `Received unexpected type of first event "${ev.type}"`,
            ),
        )
      }
      return of(ev)
    }),
    share(),
  )

  const [welcome$, mutationAndReconnect$] = partition(events$, isWelcomeEvent)
  const isRelevantEvent = (event: MutationEvent | ReconnectEvent | WelcomeEvent): boolean => {
    if (!options.transitions || event.type !== 'mutation') {
      return true
    }

    return options.transitions.includes(event.transition)
  }

  return fetchOnEvents(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(filter(isRelevantEvent)),
    () => fetch(client, fetchQuery, params, options),
    options.throttleTime || DEFAULT_THROTTLE_TIME,
  )
}

/**
 * Like {@link listenQuery}, but it opens no listener of its own: it follows the document preview
 * store's shared global listener, and fetches `query` once that listener has connected (right
 * away when it already has), again after every reconnect, and again after the changes
 * `shouldRefetch` accepts.
 *
 * The global listener reports every change in the dataset with the changed document's id but not
 * its content, so `shouldRefetch` has to recognise the documents the query reads by their ids.
 *
 * @internal
 */
export function listenQueryOnGlobalListener<Result>(
  client: SanityClient,
  query: string,
  options: {
    /** The document preview store's `unstable_invalidationChannel` */
    invalidationChannel: Observable<InvalidationChannelEvent>
    /**
     * Whether a change can affect the query result. Called for every change in the dataset, so it
     * has to be cheap.
     */
    shouldRefetch: (event: Extract<InvalidationChannelEvent, {type: 'mutation'}>) => boolean
    fetchTag?: string
    perspective?: ClientPerspective
  },
): Observable<Result> {
  const {invalidationChannel, shouldRefetch, fetchTag, perspective} = options

  return fetchOnEvents(
    invalidationChannel.pipe(filter((event) => event.type === 'connected')),
    invalidationChannel.pipe(filter((event) => event.type === 'mutation' && shouldRefetch(event))),
    () => fetch(client, query, {}, {tag: fetchTag, perspective}),
    DEFAULT_THROTTLE_TIME,
  )
}
