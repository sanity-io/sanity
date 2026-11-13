import {
  type ListenEvent,
  type MutationEvent,
  type ReconnectEvent,
  type SanityClient,
  type WelcomeEvent,
} from '@sanity/client'
import {
  catchError,
  connect,
  filter,
  map,
  merge,
  type Observable,
  of,
  type OperatorFunction,
  retry,
  startWith,
  switchMap,
  timer,
} from 'rxjs'

import {type CommentDocument} from '../../comments/types'
import {type TaskDocument} from '../../tasks/types'
import {shareListenerEvents} from '../sharedListener/shareListenerEvents'

/** @internal */
export type AddonDatasetDocument = CommentDocument | TaskDocument

/** @internal */
export type AddonDatasetListenerEvent =
  | WelcomeEvent
  | ReconnectEvent
  | MutationEvent<AddonDatasetDocument>

/**
 * The Studio's shared listener on the comments and tasks in the addon dataset. Every comments
 * store and the tasks store follow this one connection instead of opening their own.
 *
 * @internal
 */
export interface AddonDatasetListenerStore {
  /**
   * `welcome` once the listener has connected, `reconnect` while it reconnects, and a mutation
   * event for every change to a comment or a task in the addon dataset, carrying the document as
   * `result` unless it was deleted.
   *
   * Fetch on `welcome`, the first time and again after every reconnect. Every subscriber gets
   * every change, so keep only the documents your query reads. Transitions are relative to all
   * comments and tasks, not to your query: a document edited out of it arrives as an `update`.
   */
  events: Observable<AddonDatasetListenerEvent>
}

/** @internal */
export interface AddonDatasetListenerStoreOptions {
  /** The addon dataset client */
  client: SanityClient
}

/** @internal */
export function createAddonDatasetListenerStore({
  client,
}: AddonDatasetListenerStoreOptions): AddonDatasetListenerStore {
  const events = client.observable
    .listen<AddonDatasetDocument>(
      '*[_type in ["comment", "tasks.task"]]',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: true,
        includeAllVersions: true,
        visibility: 'query',
        tag: 'addon-dataset.listen',
      },
    )
    .pipe(
      filter(
        (event: ListenEvent<AddonDatasetDocument>): event is AddonDatasetListenerEvent =>
          event.type === 'welcome' || event.type === 'reconnect' || event.type === 'mutation',
      ),
      shareListenerEvents(),
    )

  return {events}
}

/**
 * The state of a query on the addon dataset, as {@link followAddonDatasetQuery} reports it
 *
 * @internal
 */
export type AddonDatasetQueryEvent<TDocument> =
  | {type: 'loading'}
  | {type: 'loaded'; documents: TDocument[]}
  | {type: 'error'; error: Error}
  | MutationEvent<AddonDatasetDocument>

/** @internal */
export type AddonDatasetQueryStatusEvent = Extract<
  AddonDatasetQueryEvent<never>,
  {type: 'loading' | 'error'}
>

function isConnectionEvent(
  event: AddonDatasetListenerEvent,
): event is WelcomeEvent | ReconnectEvent {
  return event.type === 'welcome' || event.type === 'reconnect'
}

function isMutationEvent(
  event: AddonDatasetListenerEvent,
): event is MutationEvent<AddonDatasetDocument> {
  return event.type === 'mutation'
}

/** How many times a failed fetch is retried before it is reported as an `error` */
const MAX_FETCH_RETRIES = 3

/**
 * Follows a query on the addon dataset through the events of the shared listener. On every
 * connection it emits `loading`, then `loaded` with the documents `fetch` returns, and a reconnect
 * cancels a fetch still in flight. A failed fetch is retried, and emits `error` once it has run
 * out of retries. Every mutation is passed on as it arrives, for every comment and task, and a
 * failed listener emits `error`.
 *
 * @internal
 */
export function followAddonDatasetQuery<TDocument>(
  fetch: Observable<TDocument[]>,
): OperatorFunction<AddonDatasetListenerEvent, AddonDatasetQueryEvent<TDocument>> {
  const loading: AddonDatasetQueryEvent<TDocument> = {type: 'loading'}
  const toError = (error: Error) => of<AddonDatasetQueryEvent<TDocument>>({type: 'error', error})

  return (events) =>
    events.pipe(
      connect((events$) =>
        merge(
          events$.pipe(
            filter(isConnectionEvent),
            switchMap((event) =>
              event.type === 'reconnect'
                ? of(loading)
                : fetch.pipe(
                    retry({
                      count: MAX_FETCH_RETRIES,
                      delay: (_error: unknown, attempt) => timer(attempt * 1000),
                    }),
                    map((documents): AddonDatasetQueryEvent<TDocument> => ({
                      type: 'loaded',
                      documents,
                    })),
                    catchError(toError),
                    startWith(loading),
                  ),
            ),
          ),
          events$.pipe(filter(isMutationEvent)),
        ),
      ),
      catchError(toError),
    )
}
