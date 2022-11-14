import {ConditionalProperty} from '@sanity/types'
import {ButtonTone, CardTone} from '@sanity/ui'
import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'

/**
 * @internal
 */
export interface SearchFilter {
  documentTypes: string[]
  fieldPath?: string
  filterType: string
  operatorType?: string
  titlePath: string[]
  value?: any
}

/**
 * @internal
 */
export type StoredSearchFilter = Omit<SearchFilter, 'documentTypes' | 'titlePath'>

export interface SearchFilterMenuItemFilter {
  filter: SearchFilter
  group?: string
  showSubtitle?: boolean
  tone?: ButtonTone
  type: 'filter'
}

export interface SearchFilterMenuItemHeader {
  title: string
  tone?: CardTone
  type: 'header'
}

export type SearchFilterMenuItem = SearchFilterMenuItemFilter | SearchFilterMenuItemHeader

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
  terms: SearchTerms
}

/**
 * @internal
 */
export interface ResolvedField {
  documentTypes: string[]
  fields?: ResolvedField[]
  filterType: string
  fieldPath: string
  hidden?: ConditionalProperty
  name: string
  options?: any
  title: string
  titlePath: string[]
  type: string
}
