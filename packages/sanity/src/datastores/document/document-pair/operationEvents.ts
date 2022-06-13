import {SanityClient} from '@sanity/client'
import {defer, asyncScheduler, merge, Observable, of, Subject, EMPTY} from 'rxjs'
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
import {IdPair, OperationArgs} from '../types'
import {HistoryStore} from '../../history'
import {OperationImpl, OperationsAPI} from './operations'
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

const operationImpls: {[name: string]: OperationImpl<any>} = {
  del: del,
  delete: del,
  publish,
  patch,
  commit,
  discardChanges,
  unpublish,
  duplicate,
  restore,
}

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

export interface OperationError {
  type: 'error'
  op: keyof OperationsAPI
  id: string
  error: Error
}

export interface OperationSuccess {
  type: 'success'
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

export type OperationEventsListener = (
  idPair: IdPair,
  typeName?: string
) => Observable<OperationSuccess | OperationError>

const listenerCache = new Map<string, OperationEventsListener>()

export function getOperationEvents(ctx: {
  client: SanityClient
  historyStore: HistoryStore
  schema: Schema
}): OperationEventsListener {
  const {dataset, projectId} = ctx.client.config()
  const cacheKey = `${projectId}-${dataset}`
  if (listenerCache.has(cacheKey)) {
    return listenerCache.get(cacheKey)!
  }

  const result$: Observable<IntermediarySuccess | IntermediaryError> = operationCalls$.pipe(
    groupBy((op) => op.idPair.publishedId),
    mergeMap((groups$) =>
      groups$.pipe(
        // although it might look like a but, dropping pending async operations here is actually a feature
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
              const isConsistent$ = consistencyStatus(ctx.client, args.idPair, args.typeName).pipe(
                filter(Boolean)
              )
              const ready$ = requiresConsistency ? isConsistent$.pipe(take(1)) : of(null)
              return ready$.pipe(
                // eslint-disable-next-line max-nested-callbacks
                mergeMap(() => execute(args.operationName, operationArguments, args.extraArgs))
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

  const cache = new Map<string, Observable<OperationSuccess | OperationError>>()

  function listener(
    idPair: IdPair,
    typeName?: string
  ): Observable<OperationSuccess | OperationError> {
    const key = `${idPair.publishedId}:${typeName}`

    let ret = cache.get(key)

    if (!ret) {
      ret = merge(result$, autoCommit$.pipe(mergeMapTo(EMPTY))).pipe(
        filter((result) => result.args.idPair.publishedId === idPair.publishedId),
        map((result): OperationSuccess | OperationError => {
          const {operationName, idPair: documentIds} = result.args
          return result.type === 'success'
            ? {type: 'success', op: operationName, id: documentIds.publishedId}
            : {type: 'error', op: operationName, id: documentIds.publishedId, error: result.error}
        })
      )

      cache.set(key, ret)
    }

    return ret
  }

  listenerCache.set(cacheKey, listener)

  return listener
}
