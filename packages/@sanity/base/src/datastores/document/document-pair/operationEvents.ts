import {defer, asyncScheduler, merge, Observable, of, Subject} from 'rxjs'
import {
  catchError,
  filter,
  groupBy,
  last,
  map,
  mergeMap,
  share,
  switchMap,
  take,
  tap,
  throttleTime,
} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
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
import {OperationImpl, OperationsAPI} from './operations/types'

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
  operationArguments,
  extraArgs
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

const results$: Observable<IntermediarySuccess | IntermediaryError> = operationCalls$.pipe(
  groupBy((op) => op.idPair.publishedId),
  mergeMap((groups$) =>
    groups$.pipe(
      // although it might look like a bug, dropping pending async operations here is actually a feature
      // E.g. if the user types `publish` which is async and then starts patching (sync) then the publish
      // should be cancelled
      switchMap((args) =>
        operationArgs(args.idPair, args.typeName).pipe(
          take(1),
          switchMap((operationArguments) => {
            const requiresConsistency = REQUIRES_CONSISTENCY.includes(args.operationName)
            if (requiresConsistency) {
              operationArguments.published.commit()
              operationArguments.draft.commit()
            }
            const isConsistent$ = consistencyStatus(args.idPair, args.typeName).pipe(
              filter(Boolean)
            )
            const ready$ = requiresConsistency ? isConsistent$.pipe(take(1)) : of(null)
            return ready$.pipe(
              // eslint-disable-next-line max-nested-callbacks
              mergeMap(() => execute(args.operationName, operationArguments, args.extraArgs))
            )
          }),
          map((): IntermediarySuccess => ({type: 'success', args})),
          catchError((err): Observable<IntermediaryError> => of({type: 'error', args, error: err}))
        )
      )
    )
  ),
  share()
)

// this enables autocommit after patch operations
const AUTOCOMMIT_INTERVAL = 1000
const autoCommit$ = results$.pipe(
  filter((result) => result.type === 'success' && result.args.operationName === 'patch'),
  throttleTime(AUTOCOMMIT_INTERVAL, asyncScheduler, {leading: true, trailing: true}),
  tap((result) => {
    emitOperation('commit', result.args.idPair, result.args.typeName, [])
  })
)

autoCommit$.subscribe()

export const operationEvents = memoize(
  (idPair: IdPair /*, typeName: string */) =>
    results$.pipe(
      filter((result) => result.args.idPair.publishedId === idPair.publishedId),
      map((result): OperationSuccess | OperationError => {
        const {operationName, idPair: documentIds} = result.args
        return result.type === 'success'
          ? {type: 'success', op: operationName, id: documentIds.publishedId}
          : {type: 'error', op: operationName, id: documentIds.publishedId, error: result.error}
      })
    ),
  (idPair, typeName) => idPair.publishedId + typeName
)
