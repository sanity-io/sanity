import React, {createElement} from 'react'
import {isValidElementType} from 'react-is'
import {PreviewLayoutKey, PreviewMediaDimensions} from './types'

export function renderPreviewMedia<Layout = PreviewLayoutKey>(
  value: React.ReactNode | React.ElementType<{layout: Layout; dimensions: PreviewMediaDimensions}>,
  layout: Layout,
  dimensions: PreviewMediaDimensions
): React.ReactNode {
  if (isValidElementType(value)) {
    return createElement(value, {layout, dimensions})
  }

  if (typeof value === 'string') {
    return <div>{value}</div>
  }

  // @todo: find out why `value` isn't infered as `React.ReactNode` here
  return value as any
}

export function renderPreviewNode<Layout = PreviewLayoutKey>(
  value: React.ReactNode | React.ElementType<{layout: Layout}>,
  layout: Layout,
  fallbackNode?: React.ReactNode
): React.ReactNode {
  if (typeof value === 'string') {
    return value
  }

  if (isValidElementType(value)) {
    return createElement(value, {layout})
  }

  // @todo: find out why `value` isn't infered as `React.ReactNode` here
  return (value as any) || fallbackNode
}
