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
const createEmitter =
  (operationName: keyof OperationsAPI, idPair: IdPair, typeName: string, storeKey: string) =>
  (...executeArgs: any[]) =>
    emitOperation(operationName, idPair, typeName, executeArgs, storeKey)

const operationCache = new Map<string, Operation<any[]>>()

function getCachedOperation<ExtraArgs extends any[], DisabledReason extends string>(
  operationName: keyof OperationsAPI,
  idPair: IdPair,
  typeName: string,
  storeKey: string,
  disabled: Operation<ExtraArgs, DisabledReason>['disabled'],
): Operation<ExtraArgs, DisabledReason> {
  const cacheKey = JSON.stringify([
    storeKey,
    idPair.publishedId,
    idPair.draftId,
    idPair.versionId ?? '',
    typeName,
    operationName,
    disabled,
  ])
  const cached = operationCache.get(cacheKey)

  if (cached) {
    return cached as Operation<ExtraArgs, DisabledReason>
  }

  const operation = {
    disabled,
    execute: createEmitter(operationName, idPair, typeName, storeKey),
  }
  operationCache.set(cacheKey, operation)
  return operation
}

function wrap<ExtraArgs extends any[], DisabledReason extends string>(
  opName: keyof OperationsAPI,
  op: OperationImpl<ExtraArgs, DisabledReason>,
  operationArgs: OperationArgs,
): Operation<ExtraArgs, DisabledReason> {
  const disabled = op.disabled(operationArgs)
  const storeKey = getOperationStoreKey(operationArgs.client)
  return getCachedOperation(
    opName,
    operationArgs.idPair,
    operationArgs.typeName,
    storeKey,
    disabled,
  )
}

export function createOperationsAPI(args: OperationArgs): OperationsAPI {
  return {
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
}
