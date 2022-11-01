import type {IntrinsicDefinitions} from '@sanity/types'
import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'

/**
 * @internal
 */
export type SearchOperatorType =
  | 'countEqualTo'
  | 'countGreaterThan'
  | 'countLessThan'
  | 'dateAfter'
  | 'dateBefore'
  | 'dateRange'
  | 'dateLast'
  | 'empty'
  | 'equalTo'
  | 'greaterThan'
  | 'greaterThanOrEqualTo'
  | 'lessThan'
  | 'lessThanOrEqualTo'
  | 'matches'
  | 'notEmpty'
  | 'notEqualTo'
  | 'notMatches'
  | 'numberRange'

/**
 * @internal
 */
export type SearchFilterType = 'compound' | 'field'

/**
 * @internal
 */
export interface BaseSearchFilter {
  operatorType?: SearchOperatorType
  type: SearchFilterType
  value?: any
}

/**
 * @internal
 */
export interface CompoundSearchFilter extends BaseSearchFilter {
  id: 'hasDraft' | 'hasReference' | 'isPublished'
  type: 'compound'
}

/**
 * @internal
 */
export interface FieldSearchFilter extends BaseSearchFilter {
  fieldPath: string
  fieldType: SupportedFieldType
  path: string[] // titles
  type: 'field'
}

/**
 * @internal
 */
export type SupportedFieldType = Exclude<
  keyof IntrinsicDefinitions,
  'block' | 'crossDatasetReference' | 'document' | 'object' | 'span'
>

/**
 * @internal
 */
export type SearchFilter = CompoundSearchFilter | FieldSearchFilter

/**
 * @internal
 */
export interface SearchFilterGroup {
  items: KeyedSearchFilter[]
  type: 'common' | 'fields' // TODO: double check
}

/**
 * @internal
 */
// TODO: rename - ValidatedSearchFilter?
export type KeyedSearchFilter = SearchFilter & {
  _key: string
  documentTypes?: string[]
  showSubtitle?: boolean
}

export interface SearchFilterMenuItemFilter {
  filter: KeyedSearchFilter
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
export interface SearchOperator {
  buttonLabel: string
  fn: (value: any, field: string) => string | null
  label: string
}

/**
 * @internal
 */
export interface OmnisearchTerms extends SearchTerms {
  filters: KeyedSearchFilter[]
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
