// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {WarningOutlineIcon} from '@sanity/icons'
import type {SanityDocument, SchemaType} from '@sanity/types'
import {assignWith} from 'lodash'
import {observeForPreview} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React from 'react'
import {combineLatest, Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'
import type {SearchItemPreviewState} from './types'

/**
 * Helper functions for retrieving and rendering document previews in search results.
 *
 * @todo Consider amalgamating with pane item helpers (which this is based off)
 * @see /packages/desk-tool/components/paneItem/helpers.tsx
 */

interface PreviewValue {
  displayOptions?: {showIcon?: boolean}
  icon?: boolean
  id?: string
  media?: React.ReactNode | React.ComponentType
  schemaType?: {name?: string}
  subtitle?: React.ReactNode
  title?: React.ReactNode
  type?: string
}

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
  schemaType: SchemaType,
  documentId: string,
  title: unknown
): Observable<SearchItemPreviewState> {
  const draft$ = isLiveEditEnabled(schemaType)
    ? of({snapshot: null})
    : observeForPreview({_id: getDraftId(documentId)}, schemaType)

  const published$ = observeForPreview({_id: getPublishedId(documentId)}, schemaType)

  return combineLatest([draft$, published$]).pipe(
    map(([draft, published]) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot as any)} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot as any)} : null,
    })),
    startWith({draft: null, isLoading: true, published: null})
  )
}

const isLiveEditEnabled = (schemaType: SchemaType) => schemaType.liveEdit === true

const getMissingDocumentFallback = (item: SanityDocument): PreviewValue => ({
  title: (
    <span style={{fontStyle: 'italic'}}>
      {item.title ? String(item.title) : 'Missing document'}
    </span>
  ),
  subtitle: (
    <span style={{fontStyle: 'italic'}}>
      {item.title ? `Missing document ID: ${item._id}` : `Document ID: ${item._id}`}
    </span>
  ),
  media: WarningOutlineIcon,
})
