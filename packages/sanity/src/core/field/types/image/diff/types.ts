import {type ObjectDiff} from '../../../types'
import {type Image, type ImageCrop, type ImageDimensions, type ImageHotspot} from '@sanity/types'

export interface ImagePreviewProps {
  id: string
  diff: ObjectDiff<Image>
  hotspot?: ImageHotspot
  crop?: ImageCrop
  is: 'from' | 'to'
  action?: 'changed' | 'added' | 'removed'
}

export interface MinimalAsset {
  url: string
  originalFilename: string
  metadata: {
    dimensions: ImageDimensions
  }
}
