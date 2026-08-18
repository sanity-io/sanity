import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {concat, EMPTY, merge, type Observable, of} from 'rxjs'
import {map, mergeMap, shareReplay} from 'rxjs/operators'

import {type HistoryStore} from '../../history/createHistoryStore'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type DocumentPairTarget, type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {operationArgs} from './operationArgs'
import {operationEvents} from './operationEvents'
import {createOperationsAPI, GUARDED} from './operations/helpers'
import {type OperationsAPI} from './operations/types'

export const editOperations = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
      pairListenerOptions?: DocumentStoreExtraOptions
    },
    idPair: IdPair,
    typeName: string,
    // The declared pair target. Threaded into `OperationArgs` (not into the shared, memoized
    // `operationArgs` stream) so the self-derived missing-version guard can honor a declared
    // creatable variant target (`allowCreate`).
    target?: DocumentPairTarget,
  ): Observable<OperationsAPI> => {
    const operationEvents$ = operationEvents(ctx)

    const operationArgs$ = operationArgs(ctx, idPair, typeName)
    const operations$ = operationArgs$.pipe(map((args) => createOperationsAPI({...args, target})))

    // To makes sure we connect the stream that actually performs the operations
    return concat(
      of(GUARDED),
      merge(operationEvents$.pipe(mergeMap(() => EMPTY)), operations$),
    ).pipe(shareReplay({refCount: true, bufferSize: 1}))
  },
  (ctx, idPair, typeName, target) =>
    // `allowCreate` changes the emitted operations for the same pair, so it must partake in the
    // memo key or a creatable and a non-creatable caller would collide on one cached stream.
    `${memoizeKeyGen(ctx.client, idPair, typeName)}-${
      target?.kind === 'variant' && target.allowCreate ? 'allow-create' : ''
    }`,
)
