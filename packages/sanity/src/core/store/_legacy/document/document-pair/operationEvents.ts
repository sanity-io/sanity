/* eslint-disable max-nested-callbacks */
import {SanityClient} from '@sanity/client'
import {asyncScheduler, defer, EMPTY, merge, Observable, of, Subject} from 'rxjs'
import {
  catchError,
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
import {Schema} from '@sanity/types'
import {IdPair} from '../types'
import {HistoryStore} from '../../history'
import {memoize} from '../utils/createMemoizer'
import {OperationArgs, OperationsAPI} from './operations'
import {operationArgs} from './operationArgs'
import {del} from './operations/delete'
import {publish} from './operations/publish'
import {patch} from './operations/patch'
import {commit} from './operations/commit'
import {discardChanges} from './operations/discardChanges'
import {unpublish} from './operations/unpublish'
import {duplicate} from './operations/duplicate'
import {restore} from './operations/restore'
import {consistencyStatus} from './consistencyStatus'

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

const execute = (
  operationName: keyof typeof operationImpls,
  operationArguments: OperationArgs,
  extraArgs: any[]
): Observable<any> => {
  const operation = operationImpls[operationName]
  return defer(() =>
    merge(of(null), maybeObservable(operation.execute(operationArguments, ...extraArgs)))
  ).pipe(last())
}

const operationCalls$ = new Subject<ExecuteArgs>()

/** @internal */
export function emitOperation(
  operationName: keyof OperationsAPI,
  idPair: IdPair,
  typeName: string,
  extraArgs: any[]
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
  (ctx: {client: SanityClient; historyStore: HistoryStore; schema: Schema}) => {
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
                  args.typeName
                ).pipe(filter(Boolean))
                const ready$ = requiresConsistency ? isConsistent$.pipe(take(1)) : of(true)
                return ready$.pipe(
                  switchMap(() => execute(args.operationName, operationArguments, args.extraArgs))
                )
              }),
              map((): IntermediarySuccess => ({type: 'success', args})),
              catchError(
                (err): Observable<IntermediaryError> => of({type: 'error', args, error: err})
              )
            )
          )
        )
      ),
      share()
    )

    // this enables autocommit after patch operations
    const AUTOCOMMIT_INTERVAL = 1000
    const autoCommit$ = result$.pipe(
      filter((result) => result.type === 'success' && result.args.operationName === 'patch'),
      throttleTime(AUTOCOMMIT_INTERVAL, asyncScheduler, {leading: true, trailing: true}),
      tap((result) => {
        emitOperation('commit', result.args.idPair, result.args.typeName, [])
      })
    )

    return merge(result$, autoCommit$.pipe(mergeMapTo(EMPTY)))
  },
  (ctx) => {
    const config = ctx.client.config()
    // we only want one of these per dataset+projectid
    return `${config.dataset ?? ''}-${config.projectId ?? ''}`
  }
)
