import {ButtonTone, CardTone} from '@sanity/ui'
import type {
  SearchableType,
  SearchOptions,
  SearchSort,
  SearchTerms,
  WeightedHit,
} from '../../../../search'
import type {SearchFieldDefinition} from './definitions/fields'
import type {SearchFilterDefinition} from './definitions/filters'

export type DocumentTypeMenuItem =
  | DocumentTypeMenuDivider
  | DocumentTypeMenuHeader
  | DocumentTypeMenuItemType

interface DocumentTypeMenuItemType {
  selected: boolean
  item: SearchableType
  type: 'item'
}

interface DocumentTypeMenuDivider {
  type: 'divider'
}

interface DocumentTypeMenuHeader {
  title: string
  type: 'header'
}

export type FilterMenuItem = FilterMenuItemFilter | FilterMenuItemHeader
export interface FilterMenuItemFilter {
  fieldDefinition?: SearchFieldDefinition
  filterDefinition: SearchFilterDefinition
  filter: SearchFilter
  group?: string
  tone?: ButtonTone
  type: 'filter'
}

export interface FilterMenuItemHeader {
  title: string
  tone?: CardTone
  type: 'header'
}

/**
 * @internal
 */
export interface SearchFilter {
  fieldId?: string
  filterName: string
  operatorType: string
  value?: any
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
  terms: SearchTerms
}
