/* eslint-disable max-nested-callbacks */
import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {asyncScheduler, defer, EMPTY, merge, type Observable, of, Subject, timer} from 'rxjs'
import {
  catchError,
  concatMap,
  filter,
  groupBy,
  last,
  map,
  mergeMap,
  mergeMapTo,
  share,
  switchMap,
  take,
  tap,
  throttleTime,
} from 'rxjs/operators'

import {type HistoryStore} from '../../history'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {consistencyStatus} from './consistencyStatus'
import {operationArgs} from './operationArgs'
import {type OperationArgs, type OperationsAPI} from './operations'
import {commit} from './operations/commit'
import {del} from './operations/delete'
import {discardChanges} from './operations/discardChanges'
import {duplicate} from './operations/duplicate'
import {patch} from './operations/patch'
import {publish} from './operations/publish'
import {restore} from './operations/restore'
import {unpublish} from './operations/unpublish'
import {del as serverDel} from './serverOperations/delete'
import {discardChanges as serverDiscardChanges} from './serverOperations/discardChanges'
import {patch as serverPatch} from './serverOperations/patch'
import {publish as serverPublish} from './serverOperations/publish'
import {restore as serverRestore} from './serverOperations/restore'
import {unpublish as serverUnpublish} from './serverOperations/unpublish'

interface ExecuteArgs {
  operationName: keyof OperationsAPI
  idPair: IdPair
  typeName: string
  extraArgs: any[]
}

function maybeObservable(v: void | Observable<any>) {
  return typeof v === 'undefined' ? of(null) : v
}

const operationImpls = {
  del: del,
  delete: del,
  publish,
  patch,
  commit,
  discardChanges,
  unpublish,
  duplicate,
  restore,
} as const

//as we add server operations one by one, we can add them here
// Note: Any changes must also be made to `createOperationsAPI`, which is defined in `packages/sanity/src/core/store/_legacy/document/document-pair/operations/helpers.ts`.
const serverOperationImpls = {
  ...operationImpls,
  del: serverDel,
  delete: serverDel,
  discardChanges: serverDiscardChanges,
  patch: serverPatch,
  publish: serverPublish,
  unpublish: serverUnpublish,
  restore: serverRestore,
}

const execute = (
  operationName: keyof typeof operationImpls,
  operationArguments: OperationArgs,
  extraArgs: any[],
  serverActionsEnabled: boolean,
): Observable<any> => {
  const operation = serverActionsEnabled
    ? serverOperationImpls[operationName]
    : operationImpls[operationName]
  return defer(() =>
    merge(of(null), maybeObservable(operation.execute(operationArguments, ...extraArgs))),
  ).pipe(last())
}

const operationCalls$ = new Subject<ExecuteArgs>()

/** @internal */
export function emitOperation(
  operationName: keyof OperationsAPI,
  idPair: IdPair,
  typeName: string,
  extraArgs: any[],
): void {
  operationCalls$.next({operationName, idPair, typeName, extraArgs})
}

// These are the operations that cannot be performed while the document is in an inconsistent state
const REQUIRES_CONSISTENCY = ['publish', 'unpublish', 'discardChanges', 'delete']

/**
 * @hidden
 * @beta */
export interface OperationError {
  type: 'error'
  /** @internal */
  op: keyof OperationsAPI
  id: string
  error: Error
}

/**
 * @hidden
 * @beta */
export interface OperationSuccess {
  type: 'success'
  /** @internal */
  op: keyof OperationsAPI
  id: string
}

interface IntermediarySuccess {
  type: 'success'
  args: ExecuteArgs
}

interface IntermediaryError {
  type: 'error'
  args: ExecuteArgs
  error: any
}

/** @internal */
export const operationEvents = memoize(
  (ctx: {
    client: SanityClient
    historyStore: HistoryStore
    schema: Schema
    serverActionsEnabled: Observable<boolean>
    extraOptions?: DocumentStoreExtraOptions
  }) => {
    const result$: Observable<IntermediarySuccess | IntermediaryError> = operationCalls$.pipe(
      groupBy((op) => op.idPair.publishedId),
      mergeMap((groups$) =>
        groups$.pipe(
          // although it might look like a bug, dropping pending async operations here is actually a feature
          // E.g. if the user types `publish` which is async and then starts patching (sync) then the publish
          // should be cancelled
          switchMap((args) =>
            operationArgs(ctx, args.idPair, args.typeName).pipe(
              take(1),
              switchMap((operationArguments) => {
                const requiresConsistency = REQUIRES_CONSISTENCY.includes(args.operationName)
                if (requiresConsistency) {
                  operationArguments.published.commit()
                  operationArguments.draft.commit()
                }
                const isConsistent$ = consistencyStatus(
                  ctx.client,
                  args.idPair,
                  args.typeName,
                  ctx.serverActionsEnabled,
                  ctx.extraOptions,
                ).pipe(filter(Boolean))
                const ready$ = requiresConsistency ? isConsistent$.pipe(take(1)) : of(true)
                return ready$.pipe(
                  switchMap(() =>
                    execute(
                      args.operationName,
                      operationArguments,
                      args.extraArgs,
                      operationArguments.serverActionsEnabled,
                    ),
                  ),
                )
              }),
              map((): IntermediarySuccess => ({type: 'success', args})),
              catchError(
                (err): Observable<IntermediaryError> => of({type: 'error', args, error: err}),
              ),
            ),
          ),
        ),
      ),
      share(),
    )

    // this enables autocommit after patch operations
    const AUTOCOMMIT_INTERVAL = 1000
    const autoCommit$ = result$.pipe(
      filter((result) => result.type === 'success' && result.args.operationName === 'patch'),
      throttleTime(AUTOCOMMIT_INTERVAL, asyncScheduler, {leading: true, trailing: true}),
      concatMap((result) =>
        (window as any).SLOW ? timer(10000).pipe(map(() => result)) : of(result),
      ),
      tap((result) => {
        emitOperation('commit', result.args.idPair, result.args.typeName, [])
      }),
    )

    return merge(result$, autoCommit$.pipe(mergeMapTo(EMPTY)))
  },
  (ctx) => {
    const config = ctx.client.config()
    // we only want one of these per dataset+projectid
    return `${config.dataset ?? ''}-${config.projectId ?? ''}${ctx.serverActionsEnabled ? '-serverActionsEnabled' : ''}`
  },
)
