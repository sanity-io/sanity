import {combineLatest, Observable} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {IdPair, SanityDocument} from '../types'
import {memoize} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {operationArgs} from './operationArgs'

export interface EditStateFor {
  id: string
  type: string
  draft: null | SanityDocument
  published: null | SanityDocument
}

export const editState = memoize(
  (idPair: IdPair, typeName: string): Observable<EditStateFor> => {
    return operationArgs(idPair, typeName).pipe(
      map(({snapshots}) => ({
        id: idPair.publishedId,
        type: typeName,
        draft: snapshots.draft,
        published: snapshots.published,
        liveEdit: isLiveEditEnabled(typeName),
      })),
      publishReplay(1),
      refCount()
    )
  },
  (idPair) => idPair.publishedId
)
