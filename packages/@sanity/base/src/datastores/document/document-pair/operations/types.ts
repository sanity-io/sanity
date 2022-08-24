import {SanityDocument} from '@sanity/types'
import {IdPair} from '../../types'
import {DocumentVersionSnapshots} from '../snapshotPair'

export interface OperationImpl<
  ExtraArgs extends any[] = [],
  DisabledReason extends string = string
> {
  disabled: (args: OperationArgs) => DisabledReason | 'NOT_READY' | false
  execute(args: OperationArgs, ...extra: ExtraArgs): void
}

export interface Operation<ExtraArgs extends any[] = [], ErrorStrings extends string = string> {
  disabled: false | ErrorStrings | 'NOT_READY'
  execute(...extra: ExtraArgs): void
}

type GuardedOperation = Operation<any[], 'NOT_READY'>
type Patch = any

// Note: Changing this interface in a backwards incompatible manner will be a breaking change
export interface OperationsAPI {
  commit: Operation | GuardedOperation
  delete: Operation<[], 'NOTHING_TO_DELETE' | 'NOT_READY'>
  del: Operation<[], 'NOTHING_TO_DELETE'> | GuardedOperation
  publish:
    | Operation<[], 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'>
    | GuardedOperation
  patch: Operation<[patches: Patch[], initialDocument: Record<string, any>]> | GuardedOperation
  discardChanges: Operation<[], 'NO_CHANGES' | 'NOT_PUBLISHED'> | GuardedOperation
  unpublish: Operation<[], 'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'> | GuardedOperation
  duplicate: Operation<[documentId: string], 'NOTHING_TO_DUPLICATE'> | GuardedOperation
  restore: Operation<[revision: string]> | GuardedOperation
}

export interface OperationArgs {
  typeName: string
  idPair: IdPair
  snapshots: {draft: null | SanityDocument; published: null | SanityDocument}
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}
