import {SchemaType} from '@sanity/types'
import React, {createElement, CSSProperties, useCallback, useMemo, useState} from 'react'
import {PreviewProps} from '../../components/previews'
import {Previewable, SortOrdering} from '../types'
import {unstable_useDocumentPreview as useDocumentPreview} from '../useDocumentPreview'
import {useVisibility} from '../useVisibility'
import {_HIDE_DELAY} from './_constants'
import {_resolvePreviewComponent} from './_resolvePreviewComponent'

export interface SanityPreviewProps extends Omit<PreviewProps, 'value'> {
  ordering?: SortOrdering
  schemaType: SchemaType
  value: Previewable
}

export function SanityPreview(props: SanityPreviewProps & {style?: CSSProperties}) {
  const {
    layout = 'default',
    ordering,
    schemaType,
    style: styleProp,
    value: params,
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
    value: params,
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

  return (
    <div ref={setRef} style={style}>
      {createElement(component, {
        ...restProps,
        error,
        isPlaceholder: !value,
        layout,
        media: value?.media,
        schemaType,
        title: value?.title,
        subtitle: value?.subtitle,
        description: value?.description,
      })}
    </div>
  )
}
