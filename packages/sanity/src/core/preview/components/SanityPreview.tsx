import {DocumentIcon} from '@sanity/icons'
import React, {
  createElement,
  CSSProperties,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {PreviewProps} from '../../components/previews'
import {RenderPreviewCallbackProps} from '../../form'
import {useVisibility} from '../useVisibility'

import {unstable_useValuePreview as useValuePreview} from '../useValuePreview'
import {_extractUploadState} from './_extractUploadState'
import {_HIDE_DELAY} from './_constants'
import {_resolvePreviewComponent} from './_resolvePreviewComponent'

function FallbackIcon() {
  return <DocumentIcon className="sanity-studio__preview-fallback-icon" />
}

/**
 * This component is responsible for converting renderPreview() calls into an element.
 * It:
 * - subscribes to "prepared" preview value as long as the element is visible on screen
 * - resolves the configured preview component for the schema type
 * - prepares "preview"-props and passes this to the configured preview component
 * @internal
 * */
export function SanityPreview(props: RenderPreviewCallbackProps): ReactElement {
  const {layout, value: valueProp, style: styleProp, schemaType, ...restProps} = props

  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const isPTE = layout && ['inline', 'block', 'blockImage'].includes(layout)

  // Subscribe to visiblity
  const visibility = useVisibility({
    // NOTE: disable when PTE preview
    element: isPTE ? null : element,
    hideDelay: _HIDE_DELAY,
  })

  // Subscribe document preview value
  const preview = useValuePreview({
    enabled: isPTE || visibility,
    schemaType,
    value: valueProp,
  })

  const {_upload, value} = useMemo(() => {
    return valueProp ? _extractUploadState(valueProp) : {_upload: undefined, value: undefined}
  }, [valueProp])

  const setRef = useCallback((refValue: HTMLDivElement | null) => {
    setElement(refValue)
  }, [])
  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      ...restProps,
      title: preview?.value?.title,
      description: preview?.value?.description,
      subtitle: preview?.value?.subtitle,
      imageUrl: _upload?.previewImage || preview?.value?.imageUrl,
      progress: _upload?.progress,
      media: _upload?.previewImage ? <img src={_upload.previewImage} /> : preview?.value?.media,
      error: preview?.error,
      isPlaceholder: preview?.isLoading,
      icon: schemaType?.icon || FallbackIcon,
      layout,
      schemaType,
      value,
    }),
    [
      _upload?.previewImage,
      _upload?.progress,
      layout,
      preview?.error,
      preview?.isLoading,
      preview?.value?.description,
      preview?.value?.imageUrl,
      preview?.value?.media,
      preview?.value?.subtitle,
      preview?.value?.title,
      restProps,
      schemaType,
      value,
    ]
  )
  const style: CSSProperties = useMemo(
    () => ({
      ...styleProp,
      minWidth: styleProp?.minWidth || 1,
      minHeight: styleProp?.minHeight || 1,
    }),
    [styleProp]
  )

  const component = _resolvePreviewComponent(schemaType)

  return (
    <div ref={setRef} style={style}>
      {createElement(component as any, previewProps as any)}
    </div>
  )
}
