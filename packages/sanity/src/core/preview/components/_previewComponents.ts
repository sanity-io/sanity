import {ComponentType} from 'react'
import {
  BlockImagePreview,
  BlockPreview,
  DefaultPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
} from '../../components'

export const _previewComponents = {
  default: DefaultPreview,
  media: MediaPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  block: BlockPreview,
  blockImage: BlockImagePreview,
} as const
