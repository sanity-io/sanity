/* eslint-disable @typescript-eslint/ban-ts-comment */

import {SanityDocument} from '@sanity/types'
import React from 'react'
import {combineLatest, concat, of, Subscription} from 'rxjs'
import {assignWith} from 'lodash'
import {map} from 'rxjs/operators'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {SanityDefaultPreview, observeForPreview} from 'part:@sanity/base/preview'
import {WarningOutlineIcon} from '@sanity/icons'
import {NotPublishedStatus} from './NotPublishedStatus'
import {DraftStatus} from './DraftStatus'

export interface DocumentPaneItemPreviewProps {
  icon: React.FunctionComponent | boolean
  layout: 'inline' | 'block' | 'default' | 'card' | 'media'
  schemaType: any
  value: SanityDocument
}

export interface DocumentPaneItemPreviewState {
  isLoading?: boolean
  draft?: SanityDocument | null
  published?: SanityDocument | null
}

const isLiveEditEnabled = (schemaType: any) => schemaType.liveEdit === true

const getStatusIndicator = (draft?: SanityDocument | null, published?: SanityDocument | null) => {
  if (draft) {
    return DraftStatus
  }
  return published ? null : NotPublishedStatus
}

const getMissingDocumentFallback = (item: SanityDocument) => ({
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

const getValueWithFallback = ({
  value,
  draft,
  published,
}: {
  value: SanityDocument
  draft?: SanityDocument | null
  published?: SanityDocument | null
}): Record<string, unknown> => {
  const snapshot = draft || published

  if (!snapshot) {
    return getMissingDocumentFallback(value)
  }

  return assignWith({}, snapshot, value, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  })
}

export class DocumentPaneItemPreview extends React.Component<
  DocumentPaneItemPreviewProps,
  DocumentPaneItemPreviewState
> {
  state: DocumentPaneItemPreviewState = {}

  subscription: Subscription

  constructor(props: DocumentPaneItemPreviewProps) {
    super(props)
    const {value, schemaType} = props
    const {title} = value
    let sync = true
    this.subscription = concat(
      of({isLoading: true}),
      combineLatest([
        isLiveEditEnabled(schemaType)
          ? of({snapshot: null})
          : observeForPreview(
              // @todo: fix typings
              {_id: getDraftId(value._id)} as any,
              schemaType
            ),
        observeForPreview(
          // @todo: fix typings
          {_id: getPublishedId(value._id)} as any,
          schemaType
        ),
      ]).pipe(
        map(([draft, published]) => ({
          draft: draft.snapshot
            ? {
                title,
                ...(draft.snapshot as any),
              }
            : null,
          published: published.snapshot
            ? {
                title,
                ...(published.snapshot as any),
              }
            : null,
          isLoading: false,
        }))
      )
    ).subscribe((state) => {
      if (sync) {
        this.state = state
      } else {
        this.setState(state)
      }
    })
    sync = false
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  render() {
    const {value, schemaType, layout, icon} = this.props
    const {draft, published, isLoading} = this.state

    return (
      <SanityDefaultPreview
        value={getValueWithFallback({value, draft, published})}
        isPlaceholder={isLoading}
        icon={icon}
        layout={layout}
        type={schemaType}
        status={isLoading ? null : getStatusIndicator(draft, published)}
      />
    )
  }
}
