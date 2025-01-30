import {type ClientPerspective} from '@sanity/client'
import {type SchemaType} from '@sanity/types'
import {type ButtonTone, type CardTone} from '@sanity/ui'

import {
  type SearchHit,
  type SearchOptions,
  type SearchSort,
  type SearchTerms,
} from '../../../../search'
import {type SearchFieldDefinition} from './definitions/fields'
import {type SearchFilterDefinition} from './definitions/filters'

export type DocumentTypeMenuItem =
  | DocumentTypeMenuDivider
  | DocumentTypeMenuHeader
  | DocumentTypeMenuItemType

interface DocumentTypeMenuItemType {
  selected: boolean
  item: SchemaType
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
export type SearchFilterValues = {
  count?: number
  value?: string | number
  from?: string | number
  to?: string | number
}

/**
 * @internal
 */
export interface SearchOrdering {
  customMeasurementLabel?: string
  ignoreScore?: boolean
  sort?: SearchSort
  /**
   * i18n key for title
   */
  titleKey: `search.ordering.${string}-label`
}

/**
 * @internal
 */
export interface SearchState {
  hits: SearchHit[]
  loading: boolean
  error: Error | null
  options?: SearchOptions
  terms: SearchTerms
  perspective?: ClientPerspective
}
