import {IdPair} from '../types'
import {defer, Observable, of} from 'rxjs'
import {createObservableCache} from '../utils/createObservableCache'
import {checkoutPair, Pair} from './checkoutPair'
import {publishReplay, refCount} from 'rxjs/operators'

const cacheOn = createObservableCache<Pair>()

export function cachedPair(idPair: IdPair): Observable<Pair> {
  return new Observable<Pair>(subscriber => {
    subscriber.next(checkoutPair(idPair))
  }).pipe(publishReplay(1), refCount(), cacheOn(idPair.publishedId))
}
