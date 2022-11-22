import React, {
  ComponentType,
  createElement,
  CSSProperties,
  ReactElement,
  useMemo,
  useState,
} from 'react'
import {RenderPreviewCallbackProps} from '../../form'
import {useVisibility} from '../useVisibility'

import {unstable_useValuePreview as useValuePreview} from '../useValuePreview'
import {PreviewProps} from '../../components'
import {_extractUploadState} from './_extractUploadState'
import {_HIDE_DELAY} from './_constants'

/**
 * This component is responsible for converting renderPreview() calls into an element.
 * It:
 * - subscribes to "prepared" preview value as long as the element is visible on screen
 * - resolves the configured preview component for the schema type
 * - prepares "preview"-props and passes this to the configured preview component
 * @internal
 * */
export function PreviewLoader(
  props: RenderPreviewCallbackProps & {
    component: ComponentType<Omit<PreviewProps, 'renderDefault'>>
  }
): ReactElement {
  const {layout, value, component, style: styleProp, schemaType, ...restProps} = props

  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const isPTE = layout && ['inline', 'block', 'blockImage'].includes(layout)

  // Subscribe to visibility
  const visibility = useVisibility({
    // NOTE: disable when PTE preview
    element: isPTE ? null : element,
    hideDelay: _HIDE_DELAY,
  })

  // Subscribe document preview value
  const preview = useValuePreview({
    enabled: isPTE || visibility,
    schemaType,
    value,
  })

  const style: CSSProperties = useMemo(
    () => ({
      ...styleProp,
      minWidth: styleProp?.minWidth || 1,
      minHeight: styleProp?.minHeight || 1,
    }),
    [styleProp]
  )

  const uploadState = useMemo(() => _extractUploadState(value), [value])

  return (
    <div ref={setElement} style={style}>
      {createElement(component, {
        ...restProps,
        ...(preview?.value || {}),
        media: uploadState?.previewImage ? (
          <img alt="The image currently being uploaded" src={uploadState.previewImage} />
        ) : (
          preview?.value?.media
        ),
        error: preview?.error,
        isPlaceholder: preview?.isLoading,
        layout,
        schemaType,
      })}
    </div>
  )
}
