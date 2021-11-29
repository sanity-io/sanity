// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SanityDocument, SchemaType} from '@sanity/types'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import React from 'react'
import type {Subscription} from 'rxjs'
import {getPreviewStateObservable, getStatusIndicator, getValueWithFallback} from './helpers'
import type {PaneItemPreviewState} from './types'

export interface PaneItemPreviewProps {
  icon: React.ComponentType<any> | false
  layout: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
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
    const {value, layout, icon} = this.props
    const {draft, published, isLoading} = this.state

    return (
      <SanityDefaultPreview
        value={getValueWithFallback({value, draft, published})}
        isPlaceholder={isLoading}
        icon={icon}
        layout={layout}
        status={isLoading ? null : getStatusIndicator(draft, published)}
      />
    )
  }
}
