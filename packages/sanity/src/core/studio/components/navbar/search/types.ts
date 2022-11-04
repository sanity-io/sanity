import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'
import type {SupportedCustomType, SupportedFieldType} from './definitions/filters/types'
import type {SearchOperatorType} from './definitions/operators/types'

/**
 * @internal
 */
export interface BaseFilter<T> {
  operatorType: SearchOperatorType
  type: 'custom' | 'field'
  value?: T
}

/**
 * @internal
 */
export interface CustomFilter<T> extends BaseFilter<T> {
  id: SupportedCustomType
  type: 'custom'
}

/**
 * @internal
 */
export interface FieldFilter<T> extends BaseFilter<T> {
  fieldPath: string
  fieldType: SupportedFieldType
  path: string[]
  type: 'field'
}

/**
 * @internal
 */
export type SearchFilter<T = unknown> = CustomFilter<T> | FieldFilter<T>

/**
 * @internal
 */
export interface SearchFilterGroup {
  items: ValidatedFilter[]
  type: 'common' | 'fields'
}

/**
 * TODO: refactor out
 * @internal
 */
export type ValidatedFilter = SearchFilter & {
  _key: string
  documentTypes?: string[]
  showSubtitle?: boolean
}

export interface SearchFilterMenuItemFilter {
  filter: ValidatedFilter
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
  filters: ValidatedFilter[]
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
