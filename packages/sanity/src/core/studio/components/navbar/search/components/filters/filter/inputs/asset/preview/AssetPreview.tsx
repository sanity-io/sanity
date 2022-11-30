import type {Asset} from '@sanity/types'
import React from 'react'
import {FilePreview} from './FilePreview'
import {ImagePreview} from './ImagePreview'

interface AssetPreviewProps {
  asset: Asset
}
export function AssetPreview({asset}: AssetPreviewProps) {
  if (!asset) {
    return null
  }
  if (asset._type.startsWith('sanity.fileAsset')) {
    return <FilePreview asset={asset} />
  }
  if (asset._type.startsWith('sanity.imageAsset')) {
    return <ImagePreview asset={asset} />
  }
  return null
}
