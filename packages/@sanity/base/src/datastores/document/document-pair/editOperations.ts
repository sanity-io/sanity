/* eslint-disable @typescript-eslint/no-use-before-define */
import {concat, Observable, of} from 'rxjs'
import {map, publishReplay, refCount} from 'rxjs/operators'
import {IdPair} from '../types'
import {createMemoizer} from '../utils/createMemoizer'
import {createOperationsAPI, GUARDED, OperationsAPI} from './operations'
import {operationArgs} from './operationArgs'

const cacheOn = createMemoizer<OperationsAPI>()

export function editOperations(idPair: IdPair, typeName: string): Observable<OperationsAPI> {
  return concat(of(GUARDED), operationArgs(idPair, typeName).pipe(map(createOperationsAPI))).pipe(
    publishReplay(1),
    refCount(),
    cacheOn(idPair.publishedId)
  )
}
