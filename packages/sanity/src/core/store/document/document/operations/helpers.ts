import {createOperationGuard} from '../../document-pair/operations/helpers'
import {type Operation} from '../../document-pair/operations/types'
import {emitDocumentOperation, getDocumentOperationStoreKey} from '../documentOperationEvents'
import {del as serverDel} from '../serverOperations/delete'
import {discardChanges as serverDiscardChanges} from '../serverOperations/discardChanges'
import {patch as serverPatch} from '../serverOperations/patch'
import {publish as serverPublish} from '../serverOperations/publish'
import {restore as serverRestore} from '../serverOperations/restore'
import {unpublish as serverUnpublish} from '../serverOperations/unpublish'
import {commit} from './commit'
import {duplicate} from './duplicate'
import {
  type DocumentOperationImpl,
  type DocumentOperationsAPI,
  type DocumentOperationArgs,
} from './types'

// This creates a version of the operations api that will throw if called.
// Most operations depend on having the "current document state" available locally and if an action gets called
// before we have the state available, we throw an error to signal "premature" invocation before ready
export const GUARDED: DocumentOperationsAPI = {
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
  (operationName: keyof DocumentOperationsAPI, documentId: string, storeKey: string) =>
  (...executeArgs: any[]) =>
    emitDocumentOperation(operationName, documentId, executeArgs, storeKey)

function wrap<ExtraArgs extends any[], DisabledReason extends string>(
  opName: keyof DocumentOperationsAPI,
  op: DocumentOperationImpl<ExtraArgs, DisabledReason>,
  operationArgs: DocumentOperationArgs,
): Operation<ExtraArgs, DisabledReason> {
  const disabled = op.disabled(operationArgs)
  const storeKey = getDocumentOperationStoreKey(operationArgs.client)
  return {
    disabled,
    execute: createEmitter(opName, operationArgs.documentId, storeKey),
  }
}

export function createDocumentOperationsAPI(args: DocumentOperationArgs): DocumentOperationsAPI {
  return {
    commit: wrap('commit', commit, args),
    delete: wrap('delete', serverDel, args),
    del: wrap('delete', serverDel, args),
    publish: wrap('publish', serverPublish, args),
    patch: wrap('patch', serverPatch, args),
    discardChanges: wrap('discardChanges', serverDiscardChanges, args),
    unpublish: wrap('unpublish', serverUnpublish, args),
    duplicate: wrap('duplicate', duplicate, args),
    restore: wrap('restore', serverRestore, args),
  }
}
