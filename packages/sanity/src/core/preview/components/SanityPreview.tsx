import {SchemaType, SortOrdering} from '@sanity/types'
import React, {createElement, CSSProperties, useCallback, useMemo, useState} from 'react'
import {PreviewProps} from '../../components'
import {Previewable} from '../types'
import {unstable_useDocumentPreview as useDocumentPreview} from '../useDocumentPreview'
import {useVisibility} from '../useVisibility'
import {_HIDE_DELAY} from './_constants'
import {_resolvePreviewComponent} from './_resolvePreviewComponent'

/** @internal */
export interface SanityPreviewProps
  extends Omit<PreviewProps, 'value' | 'renderDefault' | 'schemaType'> {
  ordering?: SortOrdering
  schemaType: SchemaType
  value: Previewable
}

/** @internal */
export function SanityPreview(props: SanityPreviewProps & {style?: CSSProperties}) {
  const {
    layout = 'default',
    ordering,
    schemaType,
    style: styleProp,
    value: valueProp,
    media,
    description,
    title,
    subtitle,
    ...restProps
  } = props
  const component = _resolvePreviewComponent(schemaType)
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const isPTE = ['inline', 'block', 'blockImage'].includes(layout)

  // Subscribe to visiblity
  const visibility = useVisibility({
    // NOTE: disable when PTE preview
    element: isPTE ? null : element,
    hideDelay: _HIDE_DELAY,
  })

  // Subscribe document preview value
  const {error, value} = useDocumentPreview({
    enabled: isPTE || visibility,
    ordering,
    schemaType,
    value: valueProp,
  })

  const setRef = useCallback((refValue: HTMLDivElement | null) => {
    setElement(refValue)
  }, [])

  const style: CSSProperties = useMemo(
    () => ({
      ...styleProp,
      minWidth: styleProp?.minWidth || 1,
      minHeight: styleProp?.minHeight || 1,
    }),
    [styleProp]
  )

  const previewProps: Omit<PreviewProps, 'renderDefault'> = useMemo(
    () => ({
      ...restProps,
      description: description || value?.description,
      error,
      isPlaceholder: !value,
      layout,
      media: media || value?.media,
      schemaType,
      subtitle: subtitle || value?.subtitle,
      title: title || value?.title,
      value,
    }),
    [description, error, layout, media, restProps, schemaType, subtitle, title, value]
  )

  // Remove components property to avoid component rendering itself
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {components, ...restSchemaType} = schemaType

  return (
    <div ref={setRef} style={style}>
      {createElement(component, {...previewProps, schemaType: restSchemaType})}
    </div>
  )
}
