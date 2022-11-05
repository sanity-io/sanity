import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'
import {FilterType} from './definitions/filters'
import type {OperatorType} from './definitions/operators'

/**
 * @internal
 */
export interface SearchFilterState {
  fieldPath?: string
  filterType: FilterType
  operatorType?: OperatorType
  path?: string[] // TODO: remove?
  // value?: unknown
  value?: any
}

/**
 * @internal
 */
export interface SearchFilterGroup {
  items: ValidatedFilterState[]
  type: 'common' | 'fields'
}

/**
 * TODO: refactor out
 * @internal
 */
export type ValidatedFilterState = SearchFilterState & {
  _key: string
  documentTypes?: string[]
  showSubtitle?: boolean
}

export interface SearchFilterMenuItemFilter {
  filter: ValidatedFilterState
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
  filters: ValidatedFilterState[]
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
