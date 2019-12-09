import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import {from, Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {SanityDocument} from '../types'
import {getPair} from './cached-pair'
import schema from 'part:@sanity/base/schema'
import {validateDocument} from '@sanity/validation'

export interface EditState {
  draft: null | SanityDocument
  published: null | SanityDocument
  liveEdit: boolean
  type: string
}

type Marker = any

function getValidationMarkers(draft, published): Observable<Marker[]> {
  const doc = draft.snapshot || published.snapshot
  if (!doc || !doc._type) {
    return of([])
  }
  return from(validateDocument(doc, schema) as Promise<Marker[]>)
}

export function editStateOf(publishedId: string, typeName: string): Observable<EditState> {
  if (isDraftId(publishedId)) {
    throw new Error('useDocumentActions does not expect a draft id.')
  }

  const draftId = getDraftId(publishedId)

  return getPair({publishedId, draftId}).pipe(
    switchMap(({draft, published}) =>
      getValidationMarkers(draft, published).pipe(
        map(markers => {
          const schemaType = schema.get(typeName)
          const liveEdit = !!schemaType.liveEdit
          return {
            id: publishedId,
            draft: draft.snapshot,
            published: published.snapshot,
            type: typeName,
            liveEdit,
            validation: markers
          }
        })
      )
    )
  )
}
