import {defer, merge, Observable, of, Subject} from 'rxjs'
import {OperationImpl, OperationsAPI} from './operations'
import {IdPair} from '../types'
import {
  catchError,
  filter,
  last,
  map,
  mergeMap,
  switchMap,
  take,
  withLatestFrom
} from 'rxjs/operators'
import {operationArgs} from './operationArgs'
import {createMemoizer} from '../utils/createMemoizer'
import {consistencyStatus} from './consistencyStatus'

import {del} from './operations/delete'
import {publish} from './operations/publish'
import {patch} from './operations/patch'
import {commit} from './operations/commit'
import {discardChanges} from './operations/discardChanges'
import {unpublish} from './operations/unpublish'
import {duplicate} from './operations/duplicate'
import {restore} from './operations/restore'

interface ExecuteArgs {
  operationName: keyof OperationsAPI
  publishedId: string
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
  publishedId: string,
  extraArgs: any[]
) {
  operationCalls$.next({operationName, publishedId, extraArgs})
}

const memoizeOn = createMemoizer<any>()

// These are the operations that cannot be performed while the document is in an inconsistent state
const REQUIRES_CONSISTENCY = ['publish', 'unpublish', 'discardChanges', 'delete']

export function operationEvents(idPair: IdPair, typeName: string) {
  const consistency$ = consistencyStatus(idPair)
  return operationCalls$.pipe(
    filter(emission => emission.publishedId === idPair.publishedId),
    withLatestFrom(operationArgs(idPair, typeName), consistency$),
    // although it might look like a but, dropping pending async operations here is actually a feature
    // E.g. if the user types `publish` which is async and then starts patching (sync) then the publish
    // should be cancelled
    switchMap(([operationCall, operationArgs, isConsistent]) => {
      const ready$ =
        REQUIRES_CONSISTENCY.includes(operationCall.operationName) && !isConsistent
          ? merge(
              operationArgs.published.commit(),
              operationArgs.draft.commit(),
              consistency$.pipe(
                filter(isConsistent => isConsistent),
                take(1)
              )
            )
          : of(null)

      return ready$.pipe(
        mergeMap(() =>
          execute(operationCall.operationName, operationArgs, operationCall.extraArgs)
        ),
        map(() => ({
          type: 'success',
          op: operationCall.operationName,
          id: idPair.publishedId
        })),
        catchError(err => of({type: 'error', op: operationCall.operationName, error: err}))
      )
    }),
    memoizeOn(idPair.publishedId)
  )
}
