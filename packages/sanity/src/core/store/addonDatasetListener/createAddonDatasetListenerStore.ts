import {
  type ListenEvent,
  type MutationEvent,
  type ReconnectEvent,
  type SanityClient,
  type WelcomeEvent,
} from '@sanity/client'
import {filter, type Observable} from 'rxjs'

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
