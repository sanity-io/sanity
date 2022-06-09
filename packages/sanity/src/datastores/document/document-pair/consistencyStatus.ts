import {SanityClient} from '@sanity/client'
import {Observable, combineLatest} from 'rxjs'
import {distinctUntilChanged, map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {memoize} from '../utils/createMemoizer'
import {IdPair} from '../types'
import {memoizedPair} from './memoizedPair'

// A stream of all events related to either published or draft, each event comes with a 'target'
// that specifies which version (draft|published) the event is about
export const consistencyStatus: (
  client: SanityClient,
  idPair: IdPair,
  typeName: string
) => Observable<boolean> = memoize(
  (client: SanityClient, idPair: IdPair, typeName: string) => {
    return memoizedPair(client, idPair, typeName).pipe(
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
  (_client, idPair, typeName) => idPair.publishedId + typeName
)
