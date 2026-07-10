import {type IdPair} from '../../types'
import {getOperationStoreKey} from '../getOperationStoreKey'
import {emitOperation} from '../operationEvents'
import {del as serverDel} from '../serverOperations/delete'
import {discardChanges as serverDiscardChanges} from '../serverOperations/discardChanges'
import {patch as serverPatch} from '../serverOperations/patch'
import {publish as serverPublish} from '../serverOperations/publish'
import {restore as serverRestore} from '../serverOperations/restore'
import {unpublish as serverUnpublish} from '../serverOperations/unpublish'
import {commit} from './commit'
import {duplicate} from './duplicate'
import {type Operation, type OperationArgs, type OperationImpl, type OperationsAPI} from './types'

function createOperationGuard(opName: string): Operation<any[], 'NOT_READY'> {
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

function createTargetNotFoundOperation(opName: string): Operation<any[], 'TARGET_NOT_FOUND'> {
  return {
    disabled: 'TARGET_NOT_FOUND',
    execute: () => {
      throw new Error(
        `Cannot execute "${opName}": the selected target (release or variant) does not contain this document.`,
      )
    },
  }
}

// The operations api emitted when the declared target (release or variant) has no document.
// Every operation is disabled and throws if executed anyway: falling back to the base
// draft/published pair in this state is exactly the failure mode the guard exists to prevent.
export const TARGET_NOT_FOUND_OPERATIONS: OperationsAPI = {
  commit: createTargetNotFoundOperation('commit'),
  delete: createTargetNotFoundOperation('delete'),
  del: createTargetNotFoundOperation('del'),
  publish: createTargetNotFoundOperation('publish'),
  patch: createTargetNotFoundOperation('patch'),
  discardChanges: createTargetNotFoundOperation('discardChanges'),
  unpublish: createTargetNotFoundOperation('unpublish'),
  duplicate: createTargetNotFoundOperation('duplicate'),
  restore: createTargetNotFoundOperation('restore'),
}
const createEmitter =
  (operationName: keyof OperationsAPI, idPair: IdPair, typeName: string, storeKey: string) =>
  (...executeArgs: any[]) =>
    emitOperation(operationName, idPair, typeName, executeArgs, storeKey)

function wrap<ExtraArgs extends any[], DisabledReason extends string>(
  opName: keyof OperationsAPI,
  op: OperationImpl<ExtraArgs, DisabledReason>,
  operationArgs: OperationArgs,
): Operation<ExtraArgs, DisabledReason> {
  const disabled = op.disabled(operationArgs)
  const storeKey = getOperationStoreKey(operationArgs.client)
  return {
    disabled,
    execute: createEmitter(opName, operationArgs.idPair, operationArgs.typeName, storeKey),
  }
}

export function createOperationsAPI(args: OperationArgs): OperationsAPI {
  const operations: OperationsAPI = {
    commit: wrap('commit', commit, args),
    duplicate: wrap('duplicate', duplicate, args),
    delete: wrap('delete', serverDel, args),
    del: wrap('delete', serverDel, args),
    discardChanges: wrap('discardChanges', serverDiscardChanges, args),
    patch: wrap('patch', serverPatch, args),
    publish: wrap('publish', serverPublish, args),
    unpublish: wrap('unpublish', serverUnpublish, args),
    restore: wrap('restore', serverRestore, args),
  }

  // Self-derived target guard: a version was requested, but the version
  // document doesn't exist. Mutating in this state would silently manifest the version out of
  // thin air (`patch` creates the version document) or operate on the base pair (`publish` would
  // publish the draft), so the mutating operations are disabled regardless of what the caller
  // declared. Deliberately excluded:
  const targetVersionMissing = Boolean(args.idPair.versionId && !args.snapshots.version)

  if (!targetVersionMissing) {
    return operations
  }

  return {
    ...operations,
    commit: createTargetNotFoundOperation('commit'),
    patch: createTargetNotFoundOperation('patch'),
    publish: createTargetNotFoundOperation('publish'),
    unpublish: createTargetNotFoundOperation('unpublish'),
    discardChanges: createTargetNotFoundOperation('discardChanges'),
  }
}
