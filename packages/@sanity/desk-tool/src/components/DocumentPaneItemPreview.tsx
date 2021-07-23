/* eslint-disable @typescript-eslint/ban-ts-comment */

import React from 'react'
import {combineLatest, concat, of, Subscription} from 'rxjs'
import {assignWith} from 'lodash'
import {map} from 'rxjs/operators'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import WarningIcon from 'part:@sanity/base/warning-icon'
import {SanityDefaultPreview, observeForPreview} from 'part:@sanity/base/preview'
import NotPublishedStatus from './NotPublishedStatus'
import DraftStatus from './DraftStatus'

export interface DocumentPaneItemPreviewProps {
  icon: React.FunctionComponent | boolean
  layout: 'inline' | 'block' | 'default' | 'card' | 'media'
  schemaType: any
  value: Record<string, any>
}

export interface DocumentPaneItemPreviewState {
  isLoading?: boolean
  draft?: Record<string, any> | null
  published?: Record<string, any> | null
}

const isLiveEditEnabled = (schemaType: any) => schemaType.liveEdit === true

const getStatusIndicator = (
  draft?: Record<string, any> | null,
  published?: Record<string, any> | null
) => {
  if (draft) {
    return DraftStatus
  }
  return published ? null : NotPublishedStatus
}

const getMissingDocumentFallback = (item) => ({
  title: <span style={{fontStyle: 'italic'}}>{item.title || 'Missing document'}</span>,
  subtitle: (
    <span style={{fontStyle: 'italic'}}>
      {item.title ? `Missing document ID: ${item._id}` : `Document ID: ${item._id}`}
    </span>
  ),
  media: WarningIcon,
})

const getValueWithFallback = ({
  value,
  draft,
  published,
}: {
  value: Record<string, any>
  draft?: Record<string, any> | null
  published?: Record<string, any> | null
}): Record<string, any> => {
  const snapshot = draft || published

  if (!snapshot) {
    return getMissingDocumentFallback(value)
  }

  return assignWith({}, snapshot, value, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  })
}

export default class DocumentPaneItemPreview extends React.Component<
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
                // @ts-ignore
                title,
                ...draft.snapshot,
              }
            : null,
          published: published.snapshot
            ? {
                // @ts-ignore
                title,
                ...published.snapshot,
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
