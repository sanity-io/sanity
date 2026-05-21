import {tryGetImageDimensions} from '@sanity/asset-utils'
import {type ElementType, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {PREVIEW_SIZES} from './constants'
import {type PreviewProps, type PreviewLayoutKey, type PreviewMediaDimensions} from './types'

export function renderPreviewMedia<Layout = PreviewLayoutKey>(
  value: PreviewProps<Layout>['media'],
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

  const isReactNode =
    isValidElement(value) ||
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'

  if (isReactNode) {
    return value
  }

  return null
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

export function resolveBlockImageDimensions(
  source: Parameters<typeof tryGetImageDimensions>[0],
): PreviewMediaDimensions | undefined {
  const sourceDimensions = tryGetImageDimensions(source)

  if (typeof sourceDimensions === 'undefined') {
    return undefined
  }

  const max = PREVIEW_SIZES.blockImage.media
  const scale = Math.min(max.width / sourceDimensions.width, 1)

  return {
    width: Math.round(sourceDimensions.width * scale),
    height: Math.round(sourceDimensions.height * scale),
    fit: 'max',
    dpr: getDevicePixelRatio(),
  }
}
