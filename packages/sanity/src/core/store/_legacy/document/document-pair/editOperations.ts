import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {concat, EMPTY, merge, type Observable, of} from 'rxjs'
import {map, mergeMap, shareReplay} from 'rxjs/operators'

import {type HistoryStore} from '../../history'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {operationArgs} from './operationArgs'
import {operationEvents} from './operationEvents'
import {type OperationsAPI} from './operations'
import {createOperationsAPI, GUARDED} from './operations/helpers'

export const editOperations = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
      serverActionsEnabled: Observable<boolean>
      pairListenerOptions?: DocumentStoreExtraOptions
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
