import type {SanityDocument} from '@sanity/types'

export interface SearchItemPreviewState {
  draft?: SanityDocument | null
  isLoading?: boolean
  published?: SanityDocument | null
}
