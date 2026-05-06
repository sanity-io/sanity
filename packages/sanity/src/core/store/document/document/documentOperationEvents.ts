/* eslint-disable max-nested-callbacks */
import {type SanityClient} from '@sanity/client'
import {asyncScheduler, defer, EMPTY, merge, type Observable, of, Subject, timer} from 'rxjs'
import {
  catchError,
  concatMap,
  filter,
  last,
  map,
  mergeMapTo,
  share,
  switchMap,
  take,
  tap,
  throttleTime,
} from 'rxjs/operators'

import {REQUIRES_CONSISTENCY} from '../document-pair/operationEvents'
import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {documentConsistencyStatus} from './documentConsistencyStatus'
import {documentOperationArgs} from './documentOperationArgs'
import {commit} from './operations/commit'
import {duplicate} from './operations/duplicate'
import {type DocumentOperationArgs} from './operations/types'
import {del as serverDel} from './serverOperations/delete'
import {discardChanges as serverDiscardChanges} from './serverOperations/discardChanges'
import {patch as serverPatch} from './serverOperations/patch'
import {publish as serverPublish} from './serverOperations/publish'
import {restore as serverRestore} from './serverOperations/restore'
import {unpublish as serverUnpublish} from './serverOperations/unpublish'
import {type DocumentTarget} from './types'
import {getDocumentMemoizeKey} from './utils'

type DocumentOperationName =
  | 'commit'
  | 'delete'
  | 'del'
  | 'publish'
  | 'patch'
  | 'discardChanges'
  | 'unpublish'
  | 'duplicate'
  | 'restore'

interface ExecuteArgs {
  operationName: DocumentOperationName
  documentId: string
  storeKey?: string
  extraArgs: unknown[]
}

export interface DocumentOperationError {
  type: 'error'
  op: DocumentOperationName
  id: string
  error: Error
}

export interface DocumentOperationSuccess {
  type: 'success'
  op: DocumentOperationName
  id: string
}

interface IntermediarySuccess {
  type: 'success'
  args: ExecuteArgs
}

interface IntermediaryError {
  type: 'error'
  args: ExecuteArgs
  error: Error
}

export function getDocumentOperationStoreKey(client: SanityClient): string {
  const config = client.config()
  const {projectId, dataset} = config
  if (!projectId) {
    throw new Error('Client is missing projectId')
  }
  if (!dataset) {
    throw new Error('Client is missing dataset')
  }
  return `${projectId}-${dataset}-document`
}

function maybeObservable(value: void | Observable<unknown>) {
  return typeof value === 'undefined' ? of(null) : value
}

const documentOperationCalls$ = new Subject<ExecuteArgs>()

export function emitDocumentOperation(
  operationName: DocumentOperationName,
  documentId: string,
  extraArgs: unknown[],
  storeKey?: string,
): void {
  documentOperationCalls$.next({operationName, documentId, storeKey, extraArgs})
}

const serverOperationImpls = {
  commit: commit,
  duplicate: duplicate,
  del: serverDel,
  delete: serverDel,
  discardChanges: serverDiscardChanges,
  patch: serverPatch,
  publish: serverPublish,
  unpublish: serverUnpublish,
  restore: serverRestore,
}

function execute(
  operationName: DocumentOperationName,
  operationArguments: DocumentOperationArgs,
  extraArgs: any[],
): Observable<unknown> {
  const operation = serverOperationImpls[operationName]
  return defer(() =>
    merge(of(null), maybeObservable(operation.execute(operationArguments, ...extraArgs))),
  ).pipe(last())
}

// Single-document equivalent of pair `operationEvents`: operation calls are grouped and
// executed by resolved document id, without creating or filtering an id pair.
export const documentOperationEvents: (
  ctx: DocumentContext,
  documentId: string,
  target: DocumentTarget,
  typeName: string,
) => Observable<IntermediarySuccess | IntermediaryError> = memoize(
  (ctx, documentId, target, typeName): Observable<IntermediarySuccess | IntermediaryError> => {
    const storeKey = getDocumentOperationStoreKey(ctx.client)
    const result$: Observable<IntermediarySuccess | IntermediaryError> =
      documentOperationCalls$.pipe(
        filter((operation) => operation.storeKey === storeKey || !operation.storeKey),
        filter((operation) => operation.documentId === documentId),
        switchMap((args) =>
          documentOperationArgs(ctx, args.documentId, target, typeName).pipe(
            take(1),
            switchMap((operationArguments) => {
              const requiresConsistency = REQUIRES_CONSISTENCY.includes(args.operationName)
              if (requiresConsistency) {
                operationArguments.document.commit()
              }
              const isConsistent$ = documentConsistencyStatus(
                args.documentId,
                ctx.client,
                ctx.extraOptions,
              ).pipe(filter(Boolean))
              const ready$ = requiresConsistency ? isConsistent$.pipe(take(1)) : of(true)
              return ready$.pipe(
                switchMap(() => execute(args.operationName, operationArguments, args.extraArgs)),
              )
            }),
            map((): IntermediarySuccess => ({type: 'success', args})),
            catchError((error): Observable<IntermediaryError> => of({type: 'error', args, error})),
          ),
        ),
        share(),
      )

    const AUTOCOMMIT_INTERVAL = 1000
    const autoCommit$ = result$.pipe(
      filter((result) => result.type === 'success' && result.args.operationName === 'patch'),
      throttleTime(AUTOCOMMIT_INTERVAL, asyncScheduler, {leading: true, trailing: true}),
      concatMap((result) => {
        const slowWindow = window as Window & {SLOW?: boolean}
        return slowWindow.SLOW ? timer(10000).pipe(map(() => result)) : of(result)
      }),
      tap((result) => {
        emitDocumentOperation('commit', result.args.documentId, [], result.args.storeKey)
      }),
    )

    return merge(result$, autoCommit$.pipe(mergeMapTo(EMPTY)))
  },
  (ctx, documentId) => getDocumentMemoizeKey(ctx.client, documentId),
)
