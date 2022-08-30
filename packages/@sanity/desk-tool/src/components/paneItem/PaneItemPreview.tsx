// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {DocumentPreviewPresence} from '@sanity/base/presence'
import {SanityDocument, SchemaType, User} from '@sanity/types'
import {Inline} from '@sanity/ui'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import React from 'react'
import {Subscription} from 'rxjs'
import {DraftStatus} from '../DraftStatus'
import {PublishedStatus} from '../PublishedStatus'
import {getPreviewStateObservable, getValueWithFallback} from './helpers'
import {PaneItemPreviewState} from './types'

export interface PaneItemPreviewProps {
  icon: React.ComponentType<any> | false
  layout: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
  presence?: User[]
  schemaType: SchemaType
  value: SanityDocument
}

export class PaneItemPreview extends React.Component<PaneItemPreviewProps, PaneItemPreviewState> {
  state: PaneItemPreviewState = {}

  subscription: Subscription

  constructor(props: PaneItemPreviewProps) {
    super(props)

    const {value, schemaType} = props
    const {title} = value

    let sync = true

    this.subscription = getPreviewStateObservable(schemaType, value._id, title).subscribe(
      (state) => {
        if (sync) {
          this.state = state
        } else {
          this.setState(state)
        }
      }
    )

    sync = false
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  render() {
    const {icon, layout, presence, value} = this.props
    const {draft, published, isLoading} = this.state

    const status = isLoading ? null : (
      <Inline space={4}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <PublishedStatus document={published} />
        <DraftStatus document={draft} />
      </Inline>
    )

    return (
      <SanityDefaultPreview
        value={getValueWithFallback({value, draft, published})}
        isPlaceholder={isLoading}
        icon={icon}
        layout={layout}
        status={status}
      />
    )
  }
}
