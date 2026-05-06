import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'

import {type DocumentRevision, type HistoryStore} from '../../../history'
import {type Operation, type MapDocument} from '../../document-pair/operations/types'
import {type DocumentVersionSnapshots} from '../../document-pair/snapshotPair'
import {type DocumentTarget} from '../types'

/** @internal */
export interface DocumentOperationImpl<
  ExtraArgs extends unknown[] = [],
  DisabledReason extends string = string,
> {
  disabled: (args: DocumentOperationArgs) => DisabledReason | 'NOT_READY' | false
  execute(args: DocumentOperationArgs, ...extra: ExtraArgs): void
}

type GuardedOperation = Operation<unknown[], 'NOT_READY'>
type Patch = unknown

/** @internal */
// Note: Changing this interface in a backwards incompatible manner will be a breaking change
export interface DocumentOperationsAPI {
  commit: Operation | GuardedOperation
  delete: Operation<[versions?: string[]], 'NOTHING_TO_DELETE' | 'NOT_READY'>
  del: Operation<[versions?: string[]], 'NOTHING_TO_DELETE'> | GuardedOperation
  publish:
    | Operation<[], 'ALREADY_PUBLISHED' | 'NO_CHANGES' | 'VERSION_CANT_BE_PUBLISHED'>
    | GuardedOperation
  patch: Operation<[patches: Patch[], initialDocument?: Record<string, unknown>]> | GuardedOperation
  discardChanges: Operation<[], 'NO_CHANGES' | 'NOT_PUBLISHED'> | GuardedOperation
  unpublish: Operation<[], 'NOT_PUBLISHED'> | GuardedOperation
  duplicate:
    | Operation<
        [
          documentId: string,
          options?: {
            mapDocument?: MapDocument
          },
        ],
        'NOTHING_TO_DUPLICATE'
      >
    | GuardedOperation
  restore: Operation<[revision: DocumentRevision]> | GuardedOperation
}

export interface DocumentOperationArgs {
  client: SanityClient
  /**
   * The published id of the document in the given variant.
   */
  publishedId: string | undefined
  /**
   * The draft id of the document in the given variant.
   */
  draftId: string | undefined
  typeName: string
  documentId: string
  snapshot: null | SanityDocument
  target: DocumentTarget
  historyStore: HistoryStore
  document: DocumentVersionSnapshots
}
