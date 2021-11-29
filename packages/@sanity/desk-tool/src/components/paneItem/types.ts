import type {SanityDocument} from '@sanity/types'

export interface PaneItemPreviewState {
  isLoading?: boolean
  draft?: SanityDocument | null
  published?: SanityDocument | null
}
