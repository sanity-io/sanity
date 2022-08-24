/* eslint-disable @typescript-eslint/no-use-before-define */
import {concat, merge, Observable, of, EMPTY} from 'rxjs'
import {map, publishReplay, refCount, mergeMapTo} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {OperationsAPI} from './operations'
import {operationArgs} from './operationArgs'
import {operationEvents} from './operationEvents'
import {createOperationsAPI, GUARDED} from './operations/helpers'

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
