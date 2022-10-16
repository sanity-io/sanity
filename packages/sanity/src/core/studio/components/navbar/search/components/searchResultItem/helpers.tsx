import {WarningOutlineIcon} from '@sanity/icons'
import type {PreviewValue, SanityDocument, SchemaType} from '@sanity/types'
import {assignWith} from 'lodash'
import React from 'react'
import {combineLatest, Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'
import type {DocumentPreviewStore} from '../../../../../../preview/documentPreviewStore'
import {getDraftId, getPublishedId} from '../../../../../../util/draftUtils'
import type {SearchItemPreviewState} from './types'

/**
 * Helper functions for retrieving and rendering document previews in search results.
 *
 * TODO: Consider amalgamating with pane item helpers (which this is based off)
 * /desk/components/paneItem/helpers.tsx
 */

const isLiveEditEnabled = (schemaType: SchemaType) => schemaType.liveEdit === true

export const getMissingDocumentFallback = (item: SanityDocument): PreviewValue => ({
  title: <em>{item.title ? String(item.title) : 'Missing document'}</em>,
  subtitle: <em>{item.title ? `Missing document ID: ${item._id}` : `Document ID: ${item._id}`}</em>,
  media: WarningOutlineIcon,
})

export const getValueWithFallback = ({
  value,
  draft,
  published,
}: {
  value: SanityDocument
  draft?: SanityDocument | null
  published?: SanityDocument | null
}): PreviewValue | SanityDocument => {
  const snapshot = draft || published

  if (!snapshot) {
    return getMissingDocumentFallback(value)
  }

  return assignWith({}, snapshot, value, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  })
}

export function getPreviewStateObservable(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  title: unknown
): Observable<SearchItemPreviewState> {
  const draft$ = isLiveEditEnabled(schemaType)
    ? of({snapshot: null})
    : documentPreviewStore.observeForPreview(
        {_type: 'reference', _ref: getDraftId(documentId)},
        schemaType
      )

  const published$ = documentPreviewStore.observeForPreview(
    {_type: 'reference', _ref: getPublishedId(documentId)},
    schemaType
  )

  // TODO: fix for v3
  return combineLatest([draft$, published$]).pipe(
    map(([draft, published]) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot as any)} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot as any)} : null,
    })),
    startWith({draft: null, isLoading: true, published: null})
  )
}
