/**
 * # Draft model
 *
 * The following describes the semantics of the draft model in Content Releases.
 *
 * ## Terminology
 *
 * In this world we have the following terms:
 *
 * - "Document" is unfortunately an overloaded term. It _may_ refer to the
 *   user's perspective of a document in Studio It _may_ refer to a specific
 *   document as observed through the API, or it _may_ refer to user's
 *   perspective of a document in Studio (which is a single "document group"
 *   represented by multiple documents).
 * - "Document version" is a document with the ID of `drafts.` or `versions.{bundleId}.`
 * - "Document group" is an explicit way of referring to the published
 *   document and all of its versions.
 * - "Event" (either on "a document" or on "a release") represents a change in the
 *   state. They are often caused by actions, but they are not 1-to-1. The
 *   "publish release" action causes a `ScheduleDocumentVersionEvent` for each
 *   of the document versions inside the release.
 *
 * These are higher level events and you can not assume that they are being
 * caused by a single document actions. For instance, scheduling/publishing a
 * _release_ causes a `ScheduleDocumentEvent` to appear in the document's event
 * list.
 *
 * ## Document group event
 *
 * The completely lifecycle of a document group can be described with a series
 * of _events_. These are the higher level changes such as "document was
 * published", "version was created", "document was scheduled", and so forth.
 * Every event has a single timestamp.
 *
 * We're also using the following conventions:
 *
 * - `documentId` always refers to the published document ID (which is also what
 *   we consider the ID for the whole group).
 * - `revisionId` refers to a revision on the published document.
 * - `versionId` refers to a document version ID.
 * - `releaseId` refers to the release of the document version.
 *    This will be not present if `versionId` starts with`drafts.`.
 * - `versionRevisionId` refers to a revision on a document version.
 *
 * See {@link DocumentGroupEvent} for the full list of events.
 *
 * ## Document changes
 *
 * Interestingly, there's no document group events about the _contents_ of a
 * document. Instead we have a separate concept of _document changes_ which are
 * the actual changes of the attributes to a document.
 *
 * Document changes are constructed from edits (i.e. through the Edit action),
 * but are distinct objects. They have a time_span_, instead of a time_stamp_,
 * and can have multiple authors and/or fields modified in a single "change".
 * The change could be represented by "these fields have been modifed in some
 * way" or "here's a detailed attribution of every new character that appeared
 * in this Portable Text".
 *
 * ## Release events
 *
 * There's a separate set of events for releases which deals with changes done
 * at the whole release level (e.g. schedule/publish) that are _critical_ for
 * its behavior. These events intentionally do not include changes to
 * non-critical metadata (e.g. title). This is currently not defined here.
 *
 * ## Release activity
 *
 * When looking at the complete activity of a release it should be composed of
 * three different sources:
 *
 * 1. Release events (schedule/unschedule/publish etc).
 * 2. Release metadata changes.
 * 2. Document group events related to release – with the exclusion of events
 *    which are caused by release-level actions.
 *
 * ## Relation to Content Lake APIs
 *
 * "Document group events", "document changes" and "release events" are
 * currently not exposed by the REST API in Content Lake. Some of these data
 * _might_ however already be inferred through using the History Transactions
 * API.
 *
 * The intention is for Studio to internally refer to these concepts using an
 * implementation which uses the _current_ Content Lake APIs. Over time we
 * aspire to extend the API to provide access to this data natively and
 * efficiently.
 *
 * ## Overall document lifecycle
 *
 * The overall document's existence is defined by the existance of either the
 * published document or a draft (either the main draft or a version in a
 * release).
 *
 * This means that there are two ways a document can be _created_:
 *
 * 1. `CreateDocumentVersionEvent`: This is what Studio does through an Edit action.
 * 2. `CreateLiveDocumentEvent`: A raw Create mutation sent outside of the Studio.
 *
 * The whole document is considered _deleted_ through a single event:
 *
 * 1. `DeleteDocumentGroupEvent`: This is caused either by the Delete action,
 *     or when discarding the last draft.
 *
 * ## Version lifecycle
 *
 * A document version has the following lifecycle:
 *
 * 1. "Version doesn't exist".
 *     - `CreateDocumentVersionEvent`: Edit action - "Version exists"
 *     - `UnpublishDocumentEvent`: Unpublish action - "Version exists"
 * 2. "Version exists".
 *    - `DeleteDocumentVersionEvent`: DiscardDraft action - "Version doesn't
 *       exist"
 *    - `PublishDocumentVersionEvent`: Publish document/release action - "Version doesn't exist"
 *    - `ScheduleDocumentVersionEvent`: Schedule release action - "Version is scheduled"
 *    - `DeleteDocumentGroupEvent`: Delete action _OR_ DiscardDraft [the last one] - "Version doesn't exist"
 * 3. "Version is scheduled".
 *    - `PublishDocumentVersionEvent`: Automatically, on schedule - "Version doesn't exist"
 *    - `UnscheduleDocumentVersionEvent`: Unschedule release action - "Version exists"
 *
 * ## Published lifecycle
 *
 * The published document has the following lifecycle:
 *
 * 1. "Published document doesn't exist".
 *    - `PublishDocumentVersionEvent`: Publish document/release action - "Published document exists".
 *    - `CreateLiveDocumentEvent`: Raw Create mutation - "Published document exists"
 * 2. "Published document exists"
 *    - `PublishDocumentVersionEvent`: Publish document/release action - "Published document exists"
 *    - `UnpublishDocumentEvent`: Unpublish action - "Published document doesn't exist"
 *    - `DeleteDocumentGroupEvent`: Delete action - "Published document doesn't exist"
 *    - `UpdateLiveDocumentEvent`: Raw Update mutation - "Published document exists"
 */
import {type SanityDocument} from '@sanity/types'
import {type Observable} from 'rxjs'

import {type ObjectDiff} from '../../field'
import {type ReleaseDocument} from '../../releases/store/types'
import {type DocumentVariantType} from '../../util/draftUtils'

/**
 * Events relevant for the whole document group.
 **/
export type DocumentGroupEvent =
  | CreateDocumentVersionEvent
  | DeleteDocumentVersionEvent
  | PublishDocumentVersionEvent
  | UnpublishDocumentEvent
  | ScheduleDocumentVersionEvent
  | UnscheduleDocumentVersionEvent
  | DeleteDocumentGroupEvent
  | CreateLiveDocumentEvent
  | UpdateLiveDocumentEvent
  | EditDocumentVersionEvent

export const isCreateDocumentVersionEvent = (
  event: Partial<DocumentGroupEvent>,
): event is CreateDocumentVersionEvent => event.type === 'CreateDocumentVersion'
export const isDeleteDocumentVersionEvent = (
  event: Partial<DocumentGroupEvent>,
): event is DeleteDocumentVersionEvent => event.type === 'DeleteDocumentVersion'
export const isPublishDocumentVersionEvent = (
  event: Partial<DocumentGroupEvent>,
): event is PublishDocumentVersionEvent => event.type === 'PublishDocumentVersion'
export const isUnpublishDocumentEvent = (
  event: Partial<DocumentGroupEvent>,
): event is UnpublishDocumentEvent => event.type === 'UnpublishDocument'
export const isScheduleDocumentVersionEvent = (
  event: Partial<DocumentGroupEvent>,
): event is ScheduleDocumentVersionEvent => event.type === 'ScheduleDocumentVersion'
export const isUnscheduleDocumentVersionEvent = (
  event: Partial<DocumentGroupEvent>,
): event is UnscheduleDocumentVersionEvent => event.type === 'UnscheduleDocumentVersion'
export const isDeleteDocumentGroupEvent = (
  event: Partial<DocumentGroupEvent>,
): event is DeleteDocumentGroupEvent => event.type === 'DeleteDocumentGroup'
export const isCreateLiveDocumentEvent = (
  event: Partial<DocumentGroupEvent>,
): event is CreateLiveDocumentEvent => event.type === 'CreateLiveDocument'
export const isUpdateLiveDocumentEvent = (
  event: Partial<DocumentGroupEvent>,
): event is UpdateLiveDocumentEvent => event.type === 'UpdateLiveDocument'
export const isEditDocumentVersionEvent = (
  event: Partial<DocumentGroupEvent>,
): event is EditDocumentVersionEvent => event.type === 'EditDocumentVersion'

/**
 * A generic event with a type and a timestamp.
 */
export interface BaseEvent {
  id: string
  timestamp: string
  author: string
}

export interface CreateDocumentVersionEvent extends BaseEvent {
  type: 'CreateDocumentVersion'
  documentId: string

  releaseId?: string
  versionId: string
  versionRevisionId: string

  revisionId: string
}

export interface DeleteDocumentVersionEvent extends BaseEvent {
  type: 'DeleteDocumentVersion'
  documentId: string

  releaseId?: string
  versionId: string
  versionRevisionId: string
}

export interface PublishDocumentVersionEvent extends BaseEvent {
  type: 'PublishDocumentVersion'
  documentId: string
  revisionId: string

  versionId: string
  releaseId?: string

  /** This is only available when it was triggered by Publish action. */
  versionRevisionId?: string

  /** What caused this document to be published. */
  publishCause: PublishCause

  /**
   * This is added client side to enhance the UI.
   */
  release?: ReleaseDocument
}

export type PublishCause =
  | {
      // The document was explicitly published.
      type: 'document.publish'
      author: string
    }
  | {
      // The whole release was explicitly published.
      type: 'release.publish'
      author: string
    }
  | {
      // The whole release was published through a schedule.
      type: 'release.schedule'
      author: string
      scheduledAt: string
    }

export interface UnpublishDocumentEvent extends BaseEvent {
  type: 'UnpublishDocument'
  documentId: string

  /** The version that was created based on it */
  versionId: string
  versionRevisionId: string
  releaseId?: string

  author: string
}

export interface ScheduleDocumentVersionEvent extends BaseEvent {
  type: 'ScheduleDocumentVersion'
  documentId: string

  releaseId: string
  versionId: string
  versionRevisionId: string

  /** The _current_ state of this schedule. */
  state: 'pending' | 'unscheduled' | 'published'

  author: string
  publishAt: string
}

export interface UnscheduleDocumentVersionEvent extends BaseEvent {
  type: 'UnscheduleDocumentVersion'
  documentId: string

  releaseId: string
  versionId: string
  versionRevisionId: string

  author: string
}

export interface DeleteDocumentGroupEvent extends BaseEvent {
  type: 'DeleteDocumentGroup'
  documentId: string

  author: string
}

export interface CreateLiveDocumentEvent extends BaseEvent {
  type: 'CreateLiveDocument'
  documentId: string
  revisionId: string

  author: string
}

export interface UpdateLiveDocumentEvent extends BaseEvent {
  type: 'UpdateLiveDocument'
  documentId: string
  revisionId: string

  author: string
}

/**
 * This event won't be exposed by the API, it needs to be generated by validating the
 * transactions that occurred between two events. Usually, between two PublishDocumentEvents.
 * Or a create event and a publish event.
 */
export interface EditDocumentVersionEvent extends BaseEvent {
  type: 'EditDocumentVersion'
  // Given this event could be a result of multiple edits, we could have more than one author.
  authors: string[]
  releaseId?: string
  /**
   * One edit event could contain multiple transactions that are merged together.
   * This represents the oldest transaction in the merged events.
   */
  fromRevisionId: string
  /**
   * One edit event could contain multiple transactions that are merged together.
   * This represents the newest transaction in the merged events.
   */
  revisionId: string
  transactions: {
    type: 'EditTransaction'
    author: string
    timestamp: string
    revisionId: string
  }[]
}

export interface EventsStoreRevision {
  revisionId: string
  loading: boolean
  document?: SanityDocument | null
}

export interface EventsStore {
  enabled: true
  documentVariantType: DocumentVariantType
  events: DocumentGroupEvent[]
  nextCursor: string | null
  loading: boolean
  error: Error | null
  revision: EventsStoreRevision | null
  sinceRevision: EventsStoreRevision | null
  findRangeForRevision: (nextRev: string) => [string | null, string | null]
  findRangeForSince: (nextSince: string) => [string | null, string | null]
  loadMoreEvents: () => void
  changesList: (docs: {
    to: SanityDocument
    since: SanityDocument | null
  }) => Observable<{diff: ObjectDiff | null; loading: boolean}>
}

/**
 * @internal
 * @beta
 **/
export type DocumentVersionEventType = DocumentGroupEvent['type']
