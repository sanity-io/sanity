import {SanityDocument} from '@sanity/types'
import {Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {operationArgs} from './operationArgs'

export interface EditStateFor {
  id: string
  type: string
  publishing: boolean
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  ready: boolean
}

export const editState = memoize(
  (idPair: IdPair, typeName: string): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(typeName)
    return operationArgs(idPair, typeName).pipe(
      map(({publishing, snapshots}) => ({
        id: idPair.publishedId,
        type: typeName,
        publishing: publishing,
        draft: snapshots.draft,
        published: snapshots.published,
        liveEdit,
        ready: true,
      })),
      startWith({
        id: idPair.publishedId,
        type: typeName,
        draft: null,
        publishing: false,
        published: null,
        liveEdit,
        ready: false,
      }),
      publishReplay(1),
      refCount()
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
