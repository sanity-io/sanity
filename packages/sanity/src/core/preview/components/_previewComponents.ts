import {
  BlockImagePreview,
  BlockPreview,
  CompactPreview,
  DefaultPreview,
  DetailPreview,
  InlinePreview,
  MediaPreview,
} from '../../components'

if (DefaultPreview) {
  console.log('_PREVCOMP', DefaultPreview)
} else {
  console.log('_PREVCOMP', 'DefaultPreview not found')
}

export const _previewComponents = {
  block: BlockPreview,
  blockImage: BlockImagePreview,
  compact: CompactPreview,
  default: DefaultPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  media: MediaPreview,
} as const
