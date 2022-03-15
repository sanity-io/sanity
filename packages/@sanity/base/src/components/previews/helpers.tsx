import React, {createElement} from 'react'
import {isValidElementType} from 'react-is'
import {PreviewLayoutKey, PreviewMediaDimensions} from './types'

export function renderPreviewMedia<Layout = PreviewLayoutKey>(
  value:
    | React.ReactNode
    | React.ComponentType<{layout: Layout; dimensions: PreviewMediaDimensions}>,
  layout: Layout,
  dimensions: PreviewMediaDimensions
) {
  if (isValidElementType(value)) {
    return createElement(value, {layout, dimensions})
  }

  if (typeof value === 'string') {
    return <div>{value}</div>
  }

  return value
}

export function renderPreviewNode<Layout = PreviewLayoutKey>(
  value: React.ReactNode | React.ComponentType<{layout: Layout}>,
  layout: Layout,
  fallbackNode?: React.ReactNode
) {
  if (typeof value === 'string') {
    return value
  }

  if (isValidElementType(value)) {
    return createElement(value, {layout})
  }

  return value || fallbackNode
}
