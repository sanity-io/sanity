import {SchemaType} from '@sanity/types'
import React, {useCallback} from 'react'
import type {SortOrdering} from '../types'
import {useDocumentPreviewStore} from '../../datastores'
import {WithVisibility} from './WithVisibility'
import ObserveForPreview from './ObserveForPreview'

const HIDE_DELAY = 20 * 1000

interface Props {
  type: SchemaType
  value: any
  ordering?: SortOrdering
  children: (props: any) => React.ReactElement
  layout?: string
}

export function PreviewSubscriber(props: Props) {
  const documentPreviewStore = useDocumentPreviewStore()

  const renderChild = useCallback(
    (isVisible: boolean) => {
      const {children, type, value, ordering, ...restProps} = props

      // isVisible may be null which means undetermined
      return isVisible === null ? null : (
        <ObserveForPreview
          isActive={isVisible === true}
          observeForPreview={documentPreviewStore.observeForPreview}
          type={type}
          value={value}
          ordering={ordering}
        >
          {({result, error, isLoading}) =>
            children({
              ...restProps,
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
    },
    [documentPreviewStore, props]
  )

  // Disable visibility for 'inline' and 'block' types which is used in the block editor (for now)
  // This led to strange side effects inside the block editor, and needs to be disabled for now.
  // https://github.com/sanity-io/sanity/pull/1411
  if (props.layout && ['inline', 'block'].includes(props.layout)) {
    return renderChild(true)
  }

  return <WithVisibility hideDelay={HIDE_DELAY}>{renderChild}</WithVisibility>
}
