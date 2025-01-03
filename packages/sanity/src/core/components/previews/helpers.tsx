import {type ElementType, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'

import {type PreviewLayoutKey, type PreviewMediaDimensions} from './types'

export function renderPreviewMedia<Layout = PreviewLayoutKey>(
  value: ReactNode | ElementType<{layout: Layout; dimensions: PreviewMediaDimensions}>,
  layout: Layout,
  dimensions: PreviewMediaDimensions,
): ReactNode {
  if (isValidElementType(value)) {
    const Value = value
    return <Value layout={layout} dimensions={dimensions} />
  }

  if (typeof value === 'string') {
    return <div>{value}</div>
  }

  // @todo: find out why `value` isn't infered as `ReactNode` here
  return value as any
}

export function renderPreviewNode<Layout = PreviewLayoutKey>(
  value: ReactNode | ElementType<{layout: Layout}>,
  layout: Layout,
  fallbackNode?: ReactNode,
): ReactNode {
  if (typeof value === 'string') {
    return value
  }

  if (isValidElementType(value)) {
    const Value = value
    return <Value layout={layout} />
  }

  // @todo: find out why `value` isn't infered as `ReactNode` here
  return (value as any) || fallbackNode
}
