import React from 'react'
import WithVisibility from './WithVisibility'
import ObserveForPreview from './ObserveForPreview'
import {Type} from '../types'

const HIDE_DELAY = 20 * 1000

interface Props {
  type: Type
  fields: string[]
  value: any
  ordering?: {}
  children: (props: any) => React.ReactElement
  layout?: string
}

export default class PreviewSubscriber extends React.Component<Props> {
  renderChild = (isVisible) => {
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
            snapshot: result.snapshot,
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
    if (['inline', 'block'].includes(this.props.layout)) {
      return this.renderChild(true)
    }
    return <WithVisibility hideDelay={HIDE_DELAY}>{this.renderChild}</WithVisibility>
  }
}
