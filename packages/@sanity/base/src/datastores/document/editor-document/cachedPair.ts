import {IdPair} from '../types'
import docStore from '../document-store'
import {defer, Observable, of} from 'rxjs'
import {createObservableCache} from '../utils/createObservableCache'
import {Pair} from '../checkoutPair'
import {publishReplay, refCount} from 'rxjs/operators'

const cacheOn = createObservableCache<Pair>()

export function cachedPair(idPair: IdPair): Observable<Pair> {
  return defer(() => of(docStore.checkoutPair(idPair))).pipe(
    publishReplay(1),
    refCount(),
    cacheOn(idPair.publishedId)
  )
}
