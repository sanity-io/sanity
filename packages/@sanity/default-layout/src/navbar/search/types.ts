import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '@sanity/base'

export interface SearchOrdering {
  ignoreScore?: boolean
  sort: SearchSort
  subtitle?: string
  title: string
}
export interface SearchState {
  hits: WeightedHit[]
  loading: boolean
  error: Error | null
  options?: SearchOptions
  terms: SearchTerms
}

export const ORDER_RELEVANCE: SearchOrdering = {
  sort: {direction: 'desc', field: '_updatedAt'},
  title: 'Relevance',
}

export const ORDER_CREATED_ASC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'asc', field: '_createdAt'},
  subtitle: 'Oldest first',
  title: 'Created at',
}

export const ORDER_CREATED_DESC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'desc', field: '_createdAt'},
  subtitle: 'Newest first',
  title: 'Created at',
}

export const ORDER_UPDATED_ASC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'asc', field: '_updatedAt'},
  subtitle: 'Oldest first',
  title: 'Last updated',
}

export const ORDER_UPDATED_DESC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'desc', field: '_updatedAt'},
  subtitle: 'Newest first',
  title: 'Last updated',
}
