import {IdPair} from '../types'
import {Observable} from 'rxjs'
import {memoize} from '../utils/createMemoizer'
import {checkoutPair, Pair} from './checkoutPair'
import {publishReplay, refCount} from 'rxjs/operators'

export const memoizedPair = memoize(
  (idPair: IdPair): Observable<Pair> => {
    return new Observable<Pair>((subscriber) => {
      subscriber.next(checkoutPair(idPair))
    }).pipe(publishReplay(1), refCount())
  },
  (idPair) => idPair.publishedId
)
