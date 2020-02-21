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
      switchMap(({draft, published}) => combineLatest([draft.snapshots$, published.snapshots$])),
      map(([draftSnapshot, publishedSnapshot]) => ({
        id: idPair.publishedId,
        type: typeName,
        draft: draftSnapshot,
        published: publishedSnapshot,
        liveEdit: isLiveEditEnabled(typeName)
      })),
      publishReplay(1),
      refCount()
    )
  },
  idPair => idPair.publishedId
)
