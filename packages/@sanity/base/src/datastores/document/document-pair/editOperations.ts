import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {concat, merge, Observable, of, EMPTY} from 'rxjs'
import {map, publishReplay, refCount, mergeMapTo} from 'rxjs/operators'
import {HistoryStore} from '../../history'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {operationArgs} from './operationArgs'
import {getOperationEvents} from './operationEvents'
import {createOperationsAPI, GUARDED, OperationsAPI} from './operations'

export const editOperations = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
    },
    idPair: IdPair,
    typeName: string
  ): Observable<OperationsAPI> => {
    const operationEvents = getOperationEvents(ctx)

    // To makes sure we connect the stream that actually performs the operations
    const operationResults$: Observable<never> = operationEvents(idPair, typeName).pipe(
      mergeMapTo(EMPTY)
    )

    return concat(
      of(GUARDED),
      merge(operationResults$, operationArgs(ctx, idPair, typeName).pipe(map(createOperationsAPI)))
    ).pipe(publishReplay(1), refCount())
  },
  (_ctx, idPair, typeName) => idPair.publishedId + typeName
)
