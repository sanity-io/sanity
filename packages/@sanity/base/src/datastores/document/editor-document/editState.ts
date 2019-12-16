import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import {combineLatest, concat, from, Observable, of} from 'rxjs'
import {map, switchMap, publishReplay, refCount} from 'rxjs/operators'
import {SanityDocument} from '../types'
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

export function editStateOf(publishedId: string, typeName: string): Observable<EditState> {
  if (isDraftId(publishedId)) {
    throw new Error('useDocumentActions does not expect a draft id.')
  }

  const draftId = getDraftId(publishedId)

  return snapshotPair({publishedId, draftId}).pipe(
    switchMap(({draft, published}) => combineLatest([draft.snapshots$, published.snapshots$])),
    map(([draftSnapshot, publishedSnapshot]) => {
      const schemaType = schema.get(typeName)
      const liveEdit = !!schemaType.liveEdit
      return {
        id: publishedId,
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
    cacheOn(publishedId)
  )
}
