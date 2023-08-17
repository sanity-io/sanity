import type {SanityClient} from '@sanity/client'
import {Observable} from 'rxjs'
import {publishReplay, refCount} from 'rxjs/operators'
import type {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {checkoutPair, type Pair} from './checkoutPair'
import {memoizeKeyGen} from './memoizeKeyGen'

export const memoizedPair: (
  client: SanityClient,
  idPair: IdPair,
  typeName: string,
) => Observable<Pair> = memoize(
  (client: SanityClient, idPair: IdPair, _typeName: string): Observable<Pair> => {
    return new Observable<Pair>((subscriber) => {
      subscriber.next(checkoutPair(client, idPair))
    }).pipe(publishReplay(1), refCount())
  },
  memoizeKeyGen,
)
