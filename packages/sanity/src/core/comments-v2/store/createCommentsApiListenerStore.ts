import {
  type CollaborationCommentDocument,
  type ListenEvent,
  type MutationEvent,
  type ReconnectEvent,
  type SanityClient,
  type WelcomeEvent,
} from '@sanity/client'
import {defer, type Observable} from 'rxjs'
import {filter} from 'rxjs/operators'

import {shareListenerEvents} from '../../store/sharedListener/shareListenerEvents'

/**
 * The Comments API keeps one store per organization and returns comments from every resource the
 * user can read, whatever resource the request names, so the listener names its resource itself.
 */
const LISTEN_FILTER =
  '*[_type == "sanity.comment" && string::startsWith(target.document._ref, $resourcePrefix)]'

const RESOURCE_PREFIX_PROBE_ID = 'document'

/** @internal */
export type CommentsApiListenerEvent =
  | WelcomeEvent
  | ReconnectEvent
  | MutationEvent<CollaborationCommentDocument>

/**
 * The shared Comments API listener on the comments of one resource: the workspace dataset for
 * field comments, the addon dataset for task comments. Every comments store on that resource
 * follows it instead of opening a listener of its own.
 *
 * @internal
 */
export interface CommentsApiListenerStore {
  /**
   * `welcome` once the listener has connected, `reconnect` while it reconnects, and a mutation
   * event for every change to a comment on the resource, carrying the comment as `result` unless
   * it was deleted.
   *
   * Fetch on `welcome`, the first time and again after every reconnect. Every subscriber gets
   * every change, so keep only the comments your query reads. Transitions are relative to all
   * comments on the resource, not to your query: a comment edited out of it arrives as an
   * `update`.
   */
  events: Observable<CommentsApiListenerEvent>
}

/**
 * The start of the `target.document._ref` of every comment on the client's resource
 * (`dataset:<projectId>.<dataset>:`), taken from the client's own reference format.
 *
 * @internal
 */
export function getCommentsResourcePrefix(client: SanityClient): string {
  const ref = client.collaboration.comments.getTargetDocumentRef(RESOURCE_PREFIX_PROBE_ID)
  return ref.slice(0, -RESOURCE_PREFIX_PROBE_ID.length)
}

/** @internal */
export interface CommentsApiListenerStoreOptions {
  /** A client configured for the Comments API: `collaboration.organizationId` and its resource */
  client: SanityClient
}

/** @internal */
export function createCommentsApiListenerStore({
  client,
}: CommentsApiListenerStoreOptions): CommentsApiListenerStore {
  const events = defer(() =>
    client.collaboration.comments.listen(
      LISTEN_FILTER,
      {resourcePrefix: getCommentsResourcePrefix(client)},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: true,
        includeAllVersions: true,
        visibility: 'query',
        tag: 'comments-store',
      },
    ),
  ).pipe(
    filter(
      (event: ListenEvent<CollaborationCommentDocument>): event is CommentsApiListenerEvent =>
        event.type === 'welcome' || event.type === 'reconnect' || event.type === 'mutation',
    ),
    shareListenerEvents(),
  )

  return {events}
}
