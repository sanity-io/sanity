import {SanityDocument, Schema} from '@sanity/types'
import {SanityClient} from '@sanity/client'
import {IdPair} from '../../types'
import {DocumentVersionSnapshots} from '../snapshotPair'
import {HistoryStore} from '../../../history'

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
  delete: Operation<[], 'NOTHING_TO_DELETE' | 'NOT_READY'>
  del: Operation<[], 'NOTHING_TO_DELETE'> | GuardedOperation
  publish:
    | Operation<[], 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'>
    | GuardedOperation
  patch: Operation<[patches: Patch[], initialDocument?: Record<string, any>]> | GuardedOperation
  discardChanges: Operation<[], 'NO_CHANGES' | 'NOT_PUBLISHED'> | GuardedOperation
  unpublish: Operation<[], 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'> | GuardedOperation
  duplicate: Operation<[documentId: string], 'NOTHING_TO_DUPLICATE'> | GuardedOperation
  restore: Operation<[revision: string]> | GuardedOperation
}

/** @internal */
export interface OperationArgs {
  historyStore: HistoryStore
  client: SanityClient
  schema: Schema
  typeName: string
  idPair: IdPair
  snapshots: {draft: null | SanityDocument; published: null | SanityDocument}
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}
