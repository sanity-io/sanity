import {SanityDocument} from '@sanity/types'
import {Observable} from 'rxjs'
import {map, publishReplay, refCount} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {operationArgs} from './operationArgs'

export interface EditStateFor {
  id: string
  type: string
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
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
