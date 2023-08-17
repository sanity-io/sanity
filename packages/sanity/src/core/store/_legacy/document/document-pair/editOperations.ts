import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {concat, EMPTY, merge, Observable, of} from 'rxjs'
import {map, mergeMap, shareReplay} from 'rxjs/operators'
import {HistoryStore} from '../../history'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {operationArgs} from './operationArgs'
import {OperationsAPI} from './operations'
import {createOperationsAPI, GUARDED} from './operations/helpers'
import {operationEvents} from './operationEvents'
import {memoizeKeyGen} from './memoizeKeyGen'

export const editOperations = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<OperationsAPI> => {
    const operationEvents$ = operationEvents(ctx)

    const operationArgs$ = operationArgs(ctx, idPair, typeName)
    const operations$ = operationArgs$.pipe(map(createOperationsAPI))

    // To makes sure we connect the stream that actually performs the operations
    return concat(
      of(GUARDED),
      merge(operationEvents$.pipe(mergeMap(() => EMPTY)), operations$),
    ).pipe(shareReplay({refCount: true, bufferSize: 1}))
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
