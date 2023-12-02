import {
  BlockImagePreview,
  BlockPreview,
  CompactPreview,
  DefaultPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
} from '../../components'

export const _previewComponents = {
  block: BlockPreview,
  blockImage: BlockImagePreview,
  compact: CompactPreview,
  default: DefaultPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  media: MediaPreview,
} as const
