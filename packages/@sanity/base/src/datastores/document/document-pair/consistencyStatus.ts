import {combineLatest} from 'rxjs'
import {distinctUntilChanged, map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoizedPair} from './memoizedPair'
import {createMemoizer} from '../utils/createMemoizer'

const memoizeOn = createMemoizer<boolean>()

// A stream of all events related to either published or draft, each event comes with a 'target'
// that specifies which version (draft|published) the event is about
export function consistencyStatus(idPair: IdPair) {
  return memoizedPair(idPair).pipe(
    switchMap(({draft, published}) => combineLatest([draft.consistency$, published.consistency$])),
    map(([draftIsConsistent, publishedIsConsistent]) => draftIsConsistent && publishedIsConsistent),
    distinctUntilChanged(),
    publishReplay(1),
    refCount(),
    memoizeOn(idPair.publishedId)
  )
}
