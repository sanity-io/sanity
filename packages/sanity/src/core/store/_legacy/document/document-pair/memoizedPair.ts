import {type SanityClient} from '@sanity/client'
import {Observable} from 'rxjs'
import {publishReplay, refCount} from 'rxjs/operators'

import {type PairListenerOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {checkoutPair, type Pair} from './checkoutPair'
import {memoizeKeyGen} from './memoizeKeyGen'

export const memoizedPair: (
  client: SanityClient,
  idPair: IdPair,
  typeName: string,
  serverActionsEnabled: Observable<boolean>,
  pairListenerOptions?: PairListenerOptions,
) => Observable<Pair> = memoize(
  (
    client: SanityClient,
    idPair: IdPair,
    _typeName: string,
    serverActionsEnabled: Observable<boolean>,
    pairListenerOptions?: PairListenerOptions,
  ): Observable<Pair> => {
    return new Observable<Pair>((subscriber) => {
      const pair = checkoutPair(client, idPair, serverActionsEnabled, pairListenerOptions)
      subscriber.next(pair)

      return pair.complete
    }).pipe(publishReplay(1), refCount())
  },
  memoizeKeyGen,
)
