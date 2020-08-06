import {merge, Observable} from 'rxjs'
import {filter, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {DocumentRemoteMutationEvent} from '../buffered-doc/types'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizedPair} from './memoizedPair'
import {DocumentVersion} from './checkoutPair'

export type RemoteMutationWithVersion = DocumentRemoteMutationEvent & {
  version: 'published' | 'draft'
}

function withRemoteMutation(version: DocumentVersion) {
  return version.events.pipe(
    filter((ev): ev is RemoteMutationWithVersion => ev.type === 'remoteMutation'),
    publishReplay(1),
    refCount()
  )
}

export const remoteMutations = memoize(
  (idPair: IdPair): Observable<RemoteMutationWithVersion> => {
    return memoizedPair(idPair).pipe(
      switchMap(({published, draft}) =>
        merge(withRemoteMutation(published), withRemoteMutation(draft))
      ),
      publishReplay(1),
      refCount()
    )
  },
  idPair => idPair.publishedId
)
