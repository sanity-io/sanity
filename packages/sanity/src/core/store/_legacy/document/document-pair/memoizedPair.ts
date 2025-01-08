import {type SanityClient} from '@sanity/client'
import {Observable, ReplaySubject, share, timer} from 'rxjs'

import {type PairListenerOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {checkoutPair, type Pair} from './checkoutPair'
import {memoizeKeyGen} from './memoizeKeyGen'

// How long to keep listener connected for after last unsubscribe
const LISTENER_RESET_DELAY = 10_000

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
    }).pipe(
      share({
        connector: () => new ReplaySubject(1),
        resetOnComplete: true,
        resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
      }),
    )
  },
  memoizeKeyGen,
)
