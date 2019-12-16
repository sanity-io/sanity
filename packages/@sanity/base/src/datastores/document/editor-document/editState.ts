import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'
import {concat, from, Observable, of} from 'rxjs'
import {filter, map, scan, switchMap, tap} from 'rxjs/operators'
import {SanityDocument} from '../types'
import {validateDocument} from '@sanity/validation'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {DocumentMutationEvent, DocumentRebaseEvent, SnapshotEvent} from '../buffered-doc/types'
import {documentPairEventsFor} from './documentEvents'
import schema from 'part:@sanity/base/schema'
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

// return true if the event comes with a document snapshot
function hasSnapshot(
  event: BufferedDocumentEvent
): event is (SnapshotEvent | DocumentRebaseEvent | DocumentMutationEvent) & {
  target: 'published' | 'draft'
} {
  return event.type === 'snapshot' || event.type === 'rebase' || event.type === 'mutation'
}

export function editStateOf(publishedId: string, typeName: string): Observable<EditState> {
  if (isDraftId(publishedId)) {
    throw new Error('useDocumentActions does not expect a draft id.')
  }

  const draftId = getDraftId(publishedId)

  return documentPairEventsFor({publishedId, draftId}).pipe(
    filter(hasSnapshot), // ignore events that doesn't carry snapshots, e.g. reconnect
    scan((targets, event) => ({...targets, [event.target]: event}), {draft: null, published: null}),
    filter(({draft, published}) => draft && published),
    map(({draft, published}) => {
      const schemaType = schema.get(typeName)
      const liveEdit = !!schemaType.liveEdit
      return {
        id: publishedId,
        draft: draft.document,
        published: published.document,
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
    map(state => ({validation: [], ...state}))
  )
}
