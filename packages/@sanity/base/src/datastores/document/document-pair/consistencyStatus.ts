import {combineLatest} from 'rxjs'
import {distinctUntilChanged, map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {memoizedPair} from './memoizedPair'

// A stream of all events related to either published or draft, each event comes with a 'target'
// that specifies which version (draft|published) the event is about
export const consistencyStatus = memoize(
  (idPair: IdPair, typeName) => {
    return memoizedPair(idPair, typeName).pipe(
      switchMap(({draft, published}) =>
        combineLatest([draft.consistency$, published.consistency$])
      ),
      map(
        ([draftIsConsistent, publishedIsConsistent]) => draftIsConsistent && publishedIsConsistent
      ),
      distinctUntilChanged(),
      publishReplay(1),
      refCount()
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
