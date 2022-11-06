import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'
import {FilterDefinitionType} from './definitions/filters'
import type {OperatorType} from './definitions/operators'

/**
 * @internal
 */
export interface SearchFilter {
  fieldPath?: string
  filterType: FilterDefinitionType
  operatorType?: OperatorType
  path?: string[] // TODO: remove?
  value?: any
}

/**
 * @internal
 */
export interface SearchFilterGroup {
  items: ValidatedSearchFilter[]
  type: 'common' | 'fields'
}

/**
 * TODO: refactor out
 * @internal
 */
export type ValidatedSearchFilter = SearchFilter & {
  _key: string
  documentTypes?: string[]
  showSubtitle?: boolean
}

export interface SearchFilterMenuItemFilter {
  filter: ValidatedSearchFilter
  type: 'filter'
}

export interface SearchFilterMenuItemHeader {
  title: string
  type: 'header'
}

export type SearchFilterMenuItem = (SearchFilterMenuItemFilter | SearchFilterMenuItemHeader) & {
  groupType: SearchFilterGroup['type']
}

/**
 * @internal
 */
export interface OmnisearchTerms extends SearchTerms {
  filters: ValidatedSearchFilter[]
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
