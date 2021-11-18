import {SchemaType} from '@sanity/types'
import React from 'react'
import {SortOrdering} from '../types'
import WithVisibility from './WithVisibility'
import ObserveForPreview from './ObserveForPreview'

const HIDE_DELAY = 20 * 1000

interface Props {
  type: SchemaType
  fields: string[]
  value: any
  ordering?: SortOrdering
  children: (props: any) => React.ReactElement
  layout?: string
}

export default class PreviewSubscriber extends React.Component<Props> {
  renderChild = (isVisible: boolean) => {
    const {children, type, value, ordering, fields, ...props} = this.props
    // isVisible may be null which means undetermined
    return isVisible === null ? null : (
      <ObserveForPreview
        fields={fields}
        isActive={isVisible === true}
        type={type}
        value={value}
        ordering={ordering}
      >
        {({result, error, isLoading}) =>
          children({
            ...props,
            snapshot: result.snapshot || value,
            isLoading,
            isLive: true,
            error,
            type,
            ordering,
          })
        }
      </ObserveForPreview>
    )
  }

  render() {
    // Disable visibility for 'inline' and 'block' types which is used in the block editor (for now)
    // This led to strange side effects inside the block editor, and needs to be disabled for now.
    // https://github.com/sanity-io/sanity/pull/1411
    if (this.props.layout && ['inline', 'block'].includes(this.props.layout)) {
      return this.renderChild(true)
    }
    return <WithVisibility hideDelay={HIDE_DELAY}>{this.renderChild}</WithVisibility>
  }
}
