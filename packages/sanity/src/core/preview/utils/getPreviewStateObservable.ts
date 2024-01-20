import {type PreviewValue, type SanityDocument, type SchemaType} from '@sanity/types'
import {type ReactNode} from 'react'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {getDraftId, getPublishedId} from '../../util/draftUtils'
import {type DocumentPreviewStore} from '../documentPreviewStore'

export interface PreviewState {
  isLoading?: boolean
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
}

const isLiveEditEnabled = (schemaType: SchemaType) => schemaType.liveEdit === true

/**
 * Obtain a document's published and draft state, along with loading status.
 *
 * @internal
 */
export function getPreviewStateObservable(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  title: ReactNode,
): Observable<PreviewState> {
  const draft$ = isLiveEditEnabled(schemaType)
    ? of({snapshot: null})
    : documentPreviewStore.observeForPreview(
        {_type: 'reference', _ref: getDraftId(documentId)},
        schemaType,
      )

  const published$ = documentPreviewStore.observeForPreview(
    {_type: 'reference', _ref: getPublishedId(documentId)},
    schemaType,
  )

  return combineLatest([draft$, published$]).pipe(
    map(([draft, published]) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot || {})} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot || {})} : null,
    })),
    startWith({draft: null, isLoading: true, published: null}),
  )
}
