import {type SanityClient} from '@sanity/client'
import {EMPTY, merge, Observable, of, ReplaySubject, share, timer} from 'rxjs'
import {mergeMap} from 'rxjs/operators'

import {type DocumentStoreExtraOptions} from '../getPairListener'
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
  extraOptions?: DocumentStoreExtraOptions,
) => Observable<Pair> = memoize(
  (
    client: SanityClient,
    idPair: IdPair,
    _typeName: string,
    serverActionsEnabled: Observable<boolean>,
    pairListenerOptions?: DocumentStoreExtraOptions,
  ): Observable<Pair> => {
    return new Observable<Pair>((subscriber) => {
      const pair = checkoutPair(client, idPair, serverActionsEnabled, pairListenerOptions)
      return merge(
        of(pair),
        // merge in draft, published, and version events to makes sure they receive
        // the events they need for as long as the pair is subscribed to
        pair.draft.events.pipe(mergeMap(() => EMPTY)),
        pair.published.events.pipe(mergeMap(() => EMPTY)),
        pair.version?.events.pipe(mergeMap(() => EMPTY)) ?? EMPTY,
      ).subscribe(subscriber)
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
