import {ComponentType} from 'react'
import {
  BlockImagePreview,
  BlockPreview,
  DefaultPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
  PreviewLayoutKey,
  PreviewProps,
} from '../../components'

export const _previewComponents: {
  [TLayoutKey in PreviewLayoutKey]: ComponentType<PreviewProps<TLayoutKey>>
} = {
  default: DefaultPreview,
  media: MediaPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  block: BlockPreview,
  blockImage: BlockImagePreview,
}
