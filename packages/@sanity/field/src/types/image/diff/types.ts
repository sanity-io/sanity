import type {Image, ImageHotspot, ImageCrop, ImageDimensions} from '@sanity/types'
import type {ObjectDiff} from '../../../diff'

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
