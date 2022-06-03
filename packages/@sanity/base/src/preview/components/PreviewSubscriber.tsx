import {SchemaType} from '@sanity/types'
import React from 'react'
import {PreviewProps} from '../../components/previews'
import {SortOrdering} from '../types'
import {ObserveForPreview} from './ObserveForPreview'
import {RenderPreviewSnapshotProps} from './RenderPreviewSnapshot'
import {WithVisibility} from './WithVisibility'

const HIDE_DELAY = 20 * 1000

export interface PreviewSubscriberProps extends Omit<PreviewProps, 'value'> {
  children: (props: RenderPreviewSnapshotProps) => React.ReactElement
  ordering?: SortOrdering
  schemaType: SchemaType
  value: NonNullable<PreviewProps['value']>
}

export function PreviewSubscriber(props: PreviewSubscriberProps) {
  // Disable visibility for `inline`, `block` and `blockImage` types which are used in the block
  // editor (for now).
  // This led to strange side effects inside the block editor, and needs to be disabled for now.
  // https://github.com/sanity-io/sanity/pull/1411
  if (props.layout && ['inline', 'block', 'blockImage'].includes(props.layout)) {
    return <VisiblePreview {...props} isVisible />
  }

  return (
    <WithVisibility hideDelay={HIDE_DELAY}>
      {(isVisible) =>
        // isVisible may be null which means undetermined
        isVisible !== null && <VisiblePreview {...props} isVisible={isVisible === true} />
      }
    </WithVisibility>
  )
}

function VisiblePreview(props: PreviewSubscriberProps & {isVisible: boolean}) {
  const {children, isVisible, ordering, schemaType, value, ...restProps} = props

  return (
    <ObserveForPreview
      isActive={isVisible === true}
      ordering={ordering}
      schemaType={schemaType}
      value={value}
    >
      {({error, isLoading, result}) =>
        children({
          ...restProps,
          error,
          snapshot: result.snapshot,
          isLoading,
          schemaType,
        })
      }
    </ObserveForPreview>
  )
}
