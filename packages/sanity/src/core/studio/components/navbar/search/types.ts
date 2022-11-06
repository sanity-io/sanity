import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'
import {FilterDefinitionType} from './definitions/filters'
import type {OperatorType} from './definitions/operators'

/**
 * @internal
 */
export interface SearchFilter {
  _key: string
  documentTypes: string[]
  fieldPath?: string
  filterType: FilterDefinitionType
  operatorType?: OperatorType
  titlePath: string[]
  value?: any
}

/**
 * @internal
 */
export type SavedSearchFilter = Omit<SearchFilter, '_key' | 'documentTypes' | 'titlePath'>

export interface SearchFilterMenuItemFilter {
  filter: SearchFilter
  group?: string
  showSubtitle?: boolean
  type: 'filter'
}

export interface SearchFilterMenuItemHeader {
  title: string
  type: 'header'
}

export type SearchFilterMenuItem = SearchFilterMenuItemFilter | SearchFilterMenuItemHeader

/**
 * @internal
 */
export interface OmnisearchTerms extends SearchTerms {
  filters: SearchFilter[]
}

/**
 * @internal
 */
export interface SearchOrdering {
  customMeasurementLabel?: string
  ignoreScore?: boolean
  sort: SearchSort
  title: string
}
/**
 * @internal
 */
export interface SearchState {
  hits: WeightedHit[]
  loading: boolean
  error: Error | null
  options?: SearchOptions
  terms: OmnisearchTerms
}
