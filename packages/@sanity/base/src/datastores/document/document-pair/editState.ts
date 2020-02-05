import {combineLatest, Observable} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {IdPair, SanityDocument} from '../types'
import {snapshotPair} from './snapshotPair'
import {createMemoizer} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'

export interface EditStateFor {
  id: string
  type: string
  draft: null | SanityDocument
  published: null | SanityDocument
}

const cacheOn = createMemoizer<EditStateFor>()

export function editState(idPair: IdPair, typeName: string): Observable<EditStateFor> {
  return snapshotPair(idPair).pipe(
    switchMap(({draft, published}) => combineLatest([draft.snapshots$, published.snapshots$])),
    map(([draftSnapshot, publishedSnapshot]) => ({
      id: idPair.publishedId,
      type: typeName,
      draft: draftSnapshot,
      published: publishedSnapshot,
      liveEdit: isLiveEditEnabled(typeName)
    })),
    publishReplay(1),
    refCount(),
    cacheOn(idPair.publishedId)
  )
}
