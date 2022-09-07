import type {SearchTerms, WeightedHit} from '@sanity/base'

export interface SearchSort {
  mode: 'createdAt' | 'previewTitle' | 'relevance' | 'updatedAt'
  order: 'asc' | 'desc'
}

export interface SearchState {
  hits: WeightedHit[]
  loading: boolean
  error: Error | null
  terms: SearchTerms
  /** @deprecated use terms.query */
  searchString: string
}
