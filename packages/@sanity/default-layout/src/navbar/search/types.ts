import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '@sanity/base'

export interface SearchOrdering {
  customMeasurementLabel?: string
  ignoreScore?: boolean
  sort: SearchSort
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
  customMeasurementLabel: 'relevance',
  sort: {direction: 'desc', field: '_updatedAt'},
  title: 'Relevance',
}

export const ORDER_CREATED_ASC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'asc', field: '_createdAt'},
  title: 'Created: Oldest first',
}

export const ORDER_CREATED_DESC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'desc', field: '_createdAt'},
  title: 'Created: Newest first',
}

export const ORDER_UPDATED_ASC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'asc', field: '_updatedAt'},
  title: 'Updated: Oldest first',
}

export const ORDER_UPDATED_DESC: SearchOrdering = {
  ignoreScore: true,
  sort: {direction: 'desc', field: '_updatedAt'},
  title: 'Updated: Newest first',
}
