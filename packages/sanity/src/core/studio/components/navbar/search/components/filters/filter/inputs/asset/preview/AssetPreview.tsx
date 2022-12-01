import type {ReferenceValue} from '@sanity/types'
import React from 'react'
import {FileReferencePreview} from './FileReferencePreview'
import {ImageReferencePreview} from './ImageReferencePreview'

interface AssetPreviewProps {
  reference: ReferenceValue
}
export function AssetPreview({reference}: AssetPreviewProps) {
  if (!reference) {
    return null
  }
  if (reference._type.startsWith('sanity.fileAsset')) {
    return <FileReferencePreview reference={reference} />
  }
  if (reference._type.startsWith('sanity.imageAsset')) {
    return <ImageReferencePreview reference={reference} />
  }
  return null
}
