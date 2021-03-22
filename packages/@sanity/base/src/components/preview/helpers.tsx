import React from 'react'
import {PreviewNode} from './types'

export function renderPreviewNode<T>(
  previewNode: PreviewNode<T>,
  props: T
): React.ReactElement | null {
  if (typeof previewNode === 'function') {
    return previewNode(props)
  }

  if (previewNode === undefined || previewNode === null || previewNode === '') {
    return null
  }

  return <>{previewNode}</>
}
