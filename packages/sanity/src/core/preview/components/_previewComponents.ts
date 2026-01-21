import {BlockImagePreview} from '../../components/previews/portableText/BlockImagePreview'
import {BlockPreview} from '../../components/previews/portableText/BlockPreview'
import {CompactPreview} from '../../components/previews/general/CompactPreview'
import {DefaultPreview} from '../../components/previews/general/DefaultPreview'
import {DetailPreview} from '../../components/previews/general/DetailPreview'
import {InlinePreview} from '../../components/previews/portableText/InlinePreview'
import {MediaPreview} from '../../components/previews/general/MediaPreview'

export const _previewComponents = {
  block: BlockPreview,
  blockImage: BlockImagePreview,
  compact: CompactPreview,
  default: DefaultPreview,
  detail: DetailPreview,
  inline: InlinePreview,
  media: MediaPreview,
} as const
