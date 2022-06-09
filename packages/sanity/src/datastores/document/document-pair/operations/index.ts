import {IdPair, OperationArgs} from '../../types'
import {emitOperation} from '../operationEvents'
import {del} from './delete'
import {publish} from './publish'
import {patch} from './patch'
import {commit} from './commit'
import {discardChanges} from './discardChanges'
import {unpublish} from './unpublish'
import {duplicate} from './duplicate'
import {restore} from './restore'

/* Ok, this became a bit messy - sorry
 *  The important thing to consider here is the PublicOperations interface -
 *  as long as this is properly typed, how everything else is implemented doesn't matter
 *  */

export interface GuardedOperation {
  disabled: 'NOT_READY'
  execute: () => never
}

export type WrappedOperation<ErrorStrings> = {
  disabled: false | ErrorStrings
  execute: () => void
}

export type OperationImpl<ErrorStrings> = {
  disabled: (args: OperationArgs) => false | ErrorStrings
  execute(args: OperationArgs, ...extra: any[]): void
}

export type Operation<DisabledReasons = false> =
  | GuardedOperation
  | WrappedOperation<DisabledReasons>

// Note: Changing this interface in a backwards incompatible manner will be a breaking change
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

function createOperationGuard(opName: string): GuardedOperation {
  return {
    disabled: 'NOT_READY',
    execute: () => {
      throw new Error(`Called ${opName} before it was ready.`)
    },
  }
}

// This creates a version of the operations api that will throw if called.
// Most operations depend on having the "current document state" available locally and if an action gets called
// before we have the state available, we throw an error to signal "premature" invocation before ready
export const GUARDED: OperationsAPI = {
  commit: createOperationGuard('commit'),
  delete: createOperationGuard('delete'),
  del: createOperationGuard('del'),
  publish: createOperationGuard('publish'),
  patch: createOperationGuard('patch'),
  discardChanges: createOperationGuard('discardChanges'),
  unpublish: createOperationGuard('unpublish'),
  duplicate: createOperationGuard('duplicate'),
  restore: createOperationGuard('restore'),
}

const createEmitter = (operationName: keyof OperationsAPI, idPair: IdPair, typeName: string) => {
  return (...executeArgs: any[]) => {
    return emitOperation(operationName, idPair, typeName, executeArgs)
  }
}

function wrap<ErrorStrings>(
  opName: keyof OperationsAPI,
  op: OperationImpl<ErrorStrings>,
  operationArgs: OperationArgs
): WrappedOperation<ErrorStrings> {
  const disabled = op.disabled(operationArgs)
  return {
    disabled,
    execute: createEmitter(opName, operationArgs.idPair, operationArgs.typeName),
  }
}

export function createOperationsAPI(args: OperationArgs): OperationsAPI {
  return {
    commit: wrap('commit', commit, args),
    delete: wrap('delete', del, args),
    del: wrap('delete', del, args),
    publish: wrap('publish', publish, args),
    patch: wrap('patch', patch, args),
    discardChanges: wrap('discardChanges', discardChanges, args),
    unpublish: wrap('unpublish', unpublish, args),
    duplicate: wrap('duplicate', duplicate, args),
    restore: wrap('restore', restore, args),
  }
}
