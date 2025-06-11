// Based off: https://github.com/sanity-io/sanity/blob/next/packages/@sanity/desk-tool/src/components/paneItem/helpers.tsx
import {type SanityDocument} from '@sanity/client'
import {WarningOutlineIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../preview'
import {getDraftId, getPublishedId} from '../../util/draftUtils'
import {type Schedule} from '../types'

export interface PaneItemPreviewState {
  isLoading?: boolean
  draft?: SanityDocument | null
  published?: SanityDocument | null
}

export interface PreviewValue {
  id?: string
  subtitle?: ReactNode
  title?: ReactNode
  media?: ReactNode | ComponentType
  icon?: boolean
  type?: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
}

const isLiveEditEnabled = (schemaType: any) => schemaType.liveEdit === true

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

export function getPreviewStateObservable(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  title: ReactNode,
): Observable<PaneItemPreviewState> {
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
    map(([draft, published]: any) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot || {})} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot || {})} : null,
    })),
    startWith({draft: null, isLoading: true, published: null}),
  )
}

/**
 * Whilst schedules can contain multiple documents, this plugin specifically limits schedules to one document only
 */
export function getScheduledDocument(schedule: Schedule) {
  return schedule.documents?.[0]
}

/**
 * Whilst schedules can contain multiple documents, this plugin specifically limits schedules to one document only
 */
export function getScheduledDocumentId(schedule: Schedule): string | undefined {
  return getScheduledDocument(schedule)?.documentId.replaceAll('drafts.', '')
}
