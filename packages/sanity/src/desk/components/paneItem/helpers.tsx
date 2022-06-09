import {WarningOutlineIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument, SchemaType} from '@sanity/types'
import {assignWith} from 'lodash'
import React from 'react'
import {combineLatest, Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'
import {DocumentPreviewStore} from '../../../preview'
import {getDraftId, getPublishedId} from '../../../util'
import {PaneItemPreviewState} from './types'

export const isLiveEditEnabled = (schemaType: SchemaType) => schemaType.liveEdit === true

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
  draft?: Partial<SanityDocument> | PreviewValue | null
  published?: Partial<SanityDocument> | PreviewValue | null
}): PreviewValue => {
  const snapshot = draft || published

  if (!snapshot) {
    return getMissingDocumentFallback(value)
  }

  return assignWith({}, snapshot, value, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  }) as PreviewValue
}

export function getPreviewStateObservable(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  title: React.ReactNode
): Observable<PaneItemPreviewState> {
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

  return combineLatest([draft$, published$]).pipe(
    map(([draft, published]) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot || {})} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot || {})} : null,
    })),
    startWith({draft: null, isLoading: true, published: null})
  )
}
