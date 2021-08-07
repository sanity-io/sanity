import {OperationArgs} from '../../types'
interface GuardedOperation {
  disabled: 'NOT_READY'
  execute: () => never
}
declare type WrappedOperation<ErrorStrings> = {
  disabled: false | ErrorStrings
  execute: () => void
}
export declare type OperationImpl<ErrorStrings> = {
  disabled: (args: OperationArgs) => false | ErrorStrings
  execute(args: OperationArgs, ...extra: any[]): void
}
declare type Operation<DisabledReasons = false> =
  | GuardedOperation
  | WrappedOperation<DisabledReasons>
export interface OperationsAPI {
  commit: Operation
  delete: Operation<'NOTHING_TO_DELETE'>
  del: Operation<'NOTHING_TO_DELETE'>
  publish: Operation<'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'>
  patch: Operation<(patches: any[]) => void>
  discardChanges: Operation<'NO_CHANGES' | 'NOT_PUBLISHED'>
  unpublish: Operation<'LIVE_EDIT_ENABLED' | 'NOT_PUBLISHED'>
  duplicate: Operation<'NOTHING_TO_DUPLICATE'>
  restore: Operation<(revision: string) => Promise<void>>
}
export declare const GUARDED: OperationsAPI
export declare function createOperationsAPI(args: OperationArgs): OperationsAPI
export {}
