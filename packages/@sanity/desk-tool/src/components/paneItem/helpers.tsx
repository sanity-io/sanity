// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {WarningOutlineIcon} from '@sanity/icons'
import {SanityDocument, SchemaType} from '@sanity/types'
import {assignWith} from 'lodash'
import {observeForPreview} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React from 'react'
import {combineLatest, Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'
import {Inline} from '@sanity/ui'
import {PreviewValue} from '../../types'
import {DraftStatus} from '../DraftStatus'
import {PublishedStatus} from '../PublishedStatus'
import {NotPublishedStatus} from '../NotPublishedStatus'
import {PaneItemPreviewState} from './types'

export const isLiveEditEnabled = (schemaType: any) => schemaType.liveEdit === true

export const getStatusIndicator = (
  draft?: SanityDocument | null,
  published?: SanityDocument | null
) => {
  if (published && draft) {
    return (
      <Inline space={4}>
        <PublishedStatus />
        <DraftStatus />
      </Inline>
    )
  }

  if (published) {
    return PublishedStatus
  }

  if (draft) {
    return DraftStatus
  }

  return published ? null : NotPublishedStatus
}

export const getMissingDocumentFallback = (item: SanityDocument): PreviewValue => ({
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
): Observable<PaneItemPreviewState> {
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
