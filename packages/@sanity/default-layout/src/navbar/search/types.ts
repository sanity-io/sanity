import type {SearchTerms} from '@sanity/base'

export interface SearchHit {
  _id: string
  _type: string
  resultIndex: number
  hit: {_id: string; _type: string}
}

export interface SearchState {
  hits: SearchHit[]
  loading: boolean
  error: Error | null
  terms: SearchTerms
  /** @deprecated use terms.query */
  searchString: string
}
