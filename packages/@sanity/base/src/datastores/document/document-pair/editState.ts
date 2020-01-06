import {combineLatest, concat, from, Observable, of} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {IdPair, SanityDocument} from '../types'
import schema from 'part:@sanity/base/schema'
import {snapshotPair} from './snapshotPair'
import {createObservableCache} from '../utils/createObservableCache'

export interface EditState {
  id: string
  type: string
  draft: null | SanityDocument
  published: null | SanityDocument
  liveEdit: boolean
}

const cacheOn = createObservableCache<EditState>()

export function editStateOf(idPair: IdPair, typeName: string): Observable<EditState> {
  return snapshotPair(idPair).pipe(
    switchMap(({draft, published}) => combineLatest([draft.snapshots$, published.snapshots$])),
    map(([draftSnapshot, publishedSnapshot]) => {
      const schemaType = schema.get(typeName)
      const liveEdit = !!schemaType.liveEdit
      return {
        id: idPair.publishedId,
        draft: draftSnapshot,
        published: publishedSnapshot,
        type: typeName,
        liveEdit
      }
    }),
    publishReplay(1),
    refCount(),
    cacheOn(idPair.publishedId)
  )
}
