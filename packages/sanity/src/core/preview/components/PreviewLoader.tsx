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
import type {PreviewProps} from '../../components'
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
  const {
    layout,
    value,
    component,
    style: styleProp,
    schemaType,
    skipVisibilityCheck,
    ...restProps
  } = props

  const [element, setElement] = useState<HTMLDivElement | null>(null)

  // Subscribe to visibility
  const isVisible = useVisibility({
    element: skipVisibilityCheck ? null : element,
    hideDelay: _HIDE_DELAY,
  })

  // Subscribe document preview value
  const preview = useValuePreview({
    enabled: skipVisibilityCheck || isVisible,
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

  const media: PreviewProps['media'] = useMemo(() => {
    if (uploadState?.previewImage) {
      return <img alt="The image currently being uploaded" src={uploadState.previewImage} />
    }

    if (!preview?.value?.media) {
      return schemaType.icon
    }

    // @todo: fix `TS2769: No overload matches this call.`
    return preview?.value?.media as any
  }, [preview, schemaType, uploadState])

  return (
    <div ref={setElement} style={style}>
      {createElement(component, {
        ...restProps,
        ...(preview?.value || {}),
        media,
        error: preview?.error,
        isPlaceholder: preview?.isLoading,
        layout,
        schemaType,
      })}
    </div>
  )
}
