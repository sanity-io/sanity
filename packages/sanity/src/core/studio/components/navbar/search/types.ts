import {ButtonTone, CardTone} from '@sanity/ui'
import type {SearchOptions, SearchSort, SearchTerms, WeightedHit} from '../../../../search'

/**
 * @internal
 */
export interface SearchFilter {
  fieldId?: string
  filterType: string
  operatorType?: string
  value?: any
}

export interface SearchFilterMenuItemFilter {
  field?: SearchFieldDefinition
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
export interface SearchFieldDefinition {
  documentTypes: string[]
  fieldPath: string
  filterType: string
  id: string
  name: string
  options?: any[]
  title: string
  titlePath: string[]
  type: string
}
