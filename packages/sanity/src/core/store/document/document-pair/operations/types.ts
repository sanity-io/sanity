import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type SanityDocumentLike, type Schema} from '@sanity/types'

import {type DocumentRevision, type HistoryStore} from '../../../history/createHistoryStore'
import {type IdPair} from '../../types'
import {type DocumentVersionSnapshots} from '../snapshotPair'

/** @public */
export type MapDocument = (document: SanityDocumentLike) => SanityDocumentLike

/** @internal */
export interface OperationImpl<
  ExtraArgs extends any[] = [],
  DisabledReason extends string = string,
> {
  disabled: (args: OperationArgs) => DisabledReason | 'NOT_READY' | false
  execute(args: OperationArgs, ...extra: ExtraArgs): void
}

/** @internal */
export interface Operation<ExtraArgs extends any[] = [], ErrorStrings extends string = string> {
  disabled: false | ErrorStrings | 'NOT_READY'
  execute(...extra: ExtraArgs): void
}

type GuardedOperation = Operation<any[], 'NOT_READY'>
type Patch = any

/** @internal */
// Note: Changing this interface in a backwards incompatible manner will be a breaking change
export interface OperationsAPI {
  commit: Operation | GuardedOperation
  delete: Operation<[versions?: string[]], 'NOTHING_TO_DELETE' | 'NOT_READY' | 'TARGET_NOT_FOUND'>
  del: Operation<[versions?: string[]], 'NOTHING_TO_DELETE' | 'TARGET_NOT_FOUND'> | GuardedOperation
  publish:
    | Operation<
        [options?: PublishOptions],
        | 'LIVE_EDIT_ENABLED'
        | 'ALREADY_PUBLISHED'
        | 'NO_CHANGES'
        | 'NOT_PUBLISHABLE'
        | 'TARGET_NOT_FOUND'
      >
    | GuardedOperation
  patch: Operation<[patches: Patch[], initialDocument?: Record<string, any>]> | GuardedOperation
  discardChanges:
    | Operation<[], 'NO_CHANGES' | 'NOT_PUBLISHED' | 'TARGET_NOT_FOUND'>
    | GuardedOperation
  unpublish:
    | Operation<[], 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED' | 'TARGET_NOT_FOUND'>
    | GuardedOperation
  duplicate:
    | Operation<
        [
          documentId: string,
          options?: {
            mapDocument?: MapDocument
          },
        ],
        'NOTHING_TO_DUPLICATE' | 'TARGET_NOT_FOUND'
      >
    | GuardedOperation
  restore: Operation<[revision: DocumentRevision]> | GuardedOperation
}

/**
 * Extra options for `publish.execute`.
 *
 * Variant publish locks cannot read the variant-of-published revision from pair
 * snapshots (that sibling is not in any slot). Callers that have
 * `publishedSibling` (e.g. PublishAction) pass its `_rev` here.
 *
 * @internal
 */
export interface PublishOptions {
  /**
   * Optimistic lock on the variant-of-published document's revision
   * (`ifPublishedVariantRevisionId` on `sanity.action.document.variant.publish`).
   * Ignored for base/release publish.
   */
  ifPublishedVariantRevisionId?: string
}

/** @internal */
export interface OperationArgs {
  historyStore: HistoryStore
  client: SanityClient
  schema: Schema
  typeName: string
  idPair: IdPair
  snapshots: {
    draft: null | SanityDocument
    published: null | SanityDocument
    version?: null | SanityDocument
  }
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
  version?: DocumentVersionSnapshots
  /**
   * @deprecated it's always true. Preserved to avoid breaking changes
   * Will be removed in the next major version.
   */
  serverActionsEnabled: boolean
}
