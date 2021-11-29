/* eslint-disable @typescript-eslint/no-use-before-define */
import type {Observable} from 'rxjs'
import {concat, merge, of, EMPTY} from 'rxjs'
import {map, publishReplay, refCount, mergeMapTo} from 'rxjs/operators'
import type {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import type {OperationsAPI} from './operations'
import {createOperationsAPI, GUARDED} from './operations'
import {operationArgs} from './operationArgs'
import {operationEvents} from './operationEvents'

export const editOperations = memoize(
  (idPair: IdPair, typeName: string): Observable<OperationsAPI> => {
    // To makes sure we connect the stream that actually performs the operations
    const operationResults$: Observable<never> = operationEvents(idPair, typeName).pipe(
      mergeMapTo(EMPTY)
    )

    return concat(
      of(GUARDED),
      merge(operationResults$, operationArgs(idPair, typeName).pipe(map(createOperationsAPI)))
    ).pipe(publishReplay(1), refCount())
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
