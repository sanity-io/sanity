import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {concat, merge, Observable, of, EMPTY} from 'rxjs'
import {map, publishReplay, refCount, mergeMapTo} from 'rxjs/operators'
import {HistoryStore} from '../../history'
import {IdPair} from '../types'
import {operationArgs} from './operationArgs'
import {getOperationEvents} from './operationEvents'
import {createOperationsAPI, GUARDED, OperationsAPI} from './operations'

const cache = new Map<string, Observable<OperationsAPI>>()

export const editOperations = (
  ctx: {
    client: SanityClient
    historyStore: HistoryStore
    schema: Schema
  },
  idPair: IdPair,
  typeName: string
): Observable<OperationsAPI> => {
  const key = `${idPair.publishedId}:${typeName}`
  let ret = cache.get(key)

  if (!ret) {
    const operationEvents = getOperationEvents(ctx)

    // To makes sure we connect the stream that actually performs the operations
    const operationResults$: Observable<never> = operationEvents(idPair, typeName).pipe(
      mergeMapTo(EMPTY)
    )

    const operationArgs$ = operationArgs(ctx, idPair, typeName)

    const operations$ = operationArgs$.pipe(map(createOperationsAPI))

    ret = concat(of(GUARDED), merge(operationResults$, operations$)).pipe(
      publishReplay(1),
      refCount()
    )

    cache.set(key, ret)
  }

  return ret
}
