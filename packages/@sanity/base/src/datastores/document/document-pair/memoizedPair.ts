import {IdPair} from '../types'
import {Observable} from 'rxjs'
import {createMemoizer} from '../utils/createMemoizer'
import {checkoutPair, Pair} from './checkoutPair'
import {publishReplay, refCount} from 'rxjs/operators'

const memoizeOn = createMemoizer<Pair>()

export function memoizedPair(idPair: IdPair): Observable<Pair> {
  return new Observable<Pair>(subscriber => {
    subscriber.next(checkoutPair(idPair))
  }).pipe(publishReplay(1), refCount(), memoizeOn(idPair.publishedId))
}
