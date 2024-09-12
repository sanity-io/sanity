import {
  BlockImagePreview,
  BlockPreview,
  CompactPreview,
  DefaultPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
} from '../../components'

console.log('_PREVCOMP', DefaultPreview)

export const _previewComponents = {
  block: BlockPreview,
  blockImage: BlockImagePreview,
  compact: CompactPreview,
  default: DefaultPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  media: MediaPreview,
} as const
