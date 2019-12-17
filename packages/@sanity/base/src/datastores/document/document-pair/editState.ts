import {combineLatest, concat, from, Observable, of} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {IdPair, SanityDocument} from '../types'
import {validateDocument} from '@sanity/validation'
import schema from 'part:@sanity/base/schema'
import {snapshotPair} from './snapshotPair'
import {createObservableCache} from '../utils/createObservableCache'

export interface EditState {
  id: string
  draft: null | SanityDocument
  published: null | SanityDocument
  liveEdit: boolean
  type: string
  validation: Marker[]
}

type Marker = any

function getValidationMarkers(draft, published): Observable<Marker[]> {
  const doc = draft || published
  if (!doc || !doc._type) {
    return of([])
  }
  return from(validateDocument(doc, schema) as Promise<Marker[]>)
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
    switchMap(next =>
      concat(
        of(next),
        getValidationMarkers(next.draft, next.published).pipe(
          map(markers => ({...next, validation: markers}))
        )
      )
    ),
    map(state => ({validation: [], ...state})),
    publishReplay(1),
    refCount(),
    cacheOn(idPair.publishedId)
  )
}
