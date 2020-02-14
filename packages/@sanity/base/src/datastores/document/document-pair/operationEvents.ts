import {defer, merge, Observable, of, Subject} from 'rxjs'
import {OperationImpl, OperationsAPI} from './operations'
import {IdPair} from '../types'
import {
  catchError,
  filter,
  groupBy,
  last,
  map,
  mergeMap,
  share,
  switchMap,
  take
} from 'rxjs/operators'
import {operationArgs} from './operationArgs'
import {del} from './operations/delete'
import {publish} from './operations/publish'
import {patch} from './operations/patch'
import {commit} from './operations/commit'
import {discardChanges} from './operations/discardChanges'
import {unpublish} from './operations/unpublish'
import {duplicate} from './operations/duplicate'
import {restore} from './operations/restore'
import {memoize} from '../utils/createMemoizer'
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
  restore
}

const execute = (
  operationName: keyof typeof operationImpls,
  operationArgs,
  extraArgs
): Observable<any> => {
  const operation = operationImpls[operationName]
  return defer(() =>
    merge(of(null), maybeObservable(operation.execute(operationArgs, ...extraArgs)))
  ).pipe(last())
}

const operationCalls$ = new Subject<ExecuteArgs>()

export function emitOperation(
  operationName: keyof OperationsAPI,
  idPair: IdPair,
  typeName: string,
  extraArgs: any[]
) {
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

const results$ = operationCalls$.pipe(
  groupBy(op => op.idPair.publishedId),
  mergeMap(groupedByDocId$ => {
    return groupedByDocId$.pipe(
      // although it might look like a but, dropping pending async operations here is actually a feature
      // E.g. if the user types `publish` which is async and then starts patching (sync) then the publish
      // should be cancelled
      switchMap(op => {
        return operationArgs(op.idPair, op.typeName).pipe(
          take(1),
          switchMap(operationArgs => {
            const requiresConsistency = REQUIRES_CONSISTENCY.includes(op.operationName)
            if (requiresConsistency) {
              operationArgs.published.commit()
              operationArgs.draft.commit()
            }
            const isConsistent$ = consistencyStatus(op.idPair).pipe(filter(Boolean))
            const ready$ = requiresConsistency ? isConsistent$.pipe(take(1)) : of(null)
            return ready$.pipe(
              mergeMap(() => execute(op.operationName, operationArgs, op.extraArgs))
            )
          }),
          map(
            (): OperationSuccess => ({
              type: 'success',
              op: op.operationName,
              id: op.idPair.publishedId
            })
          ),
          catchError(err =>
            of<OperationError>({
              type: 'error',
              op: op.operationName,
              id: op.idPair.publishedId,
              error: err
            })
          )
        )
      })
    )
  }),
  share()
)

export const operationEvents = memoize(
  (idPair: IdPair, typeName: string) =>
    results$.pipe(filter(result => result.id === idPair.publishedId)),
  idPair => idPair.publishedId
)
