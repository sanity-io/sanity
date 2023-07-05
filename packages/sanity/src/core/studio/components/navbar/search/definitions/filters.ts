import {IntrinsicTypeName} from '@sanity/types'
import {ComponentType} from 'react'
import {SearchOperatorType} from './operators/defaultOperators'

export type Operator<TOperators = string> = OperatorDivider | OperatorItem<TOperators>

export type OperatorDivider = {
  type: 'divider'
}

export type OperatorItem<TOperators = string> = {
  name: TOperators
  type: 'item'
}

interface SearchFilterBaseDefinition<TOperators> {
  description?: string
  icon: ComponentType
  name: string
  operators: Operator<TOperators>[]
}

export interface SearchFilterFieldDefinition<TOperators = string>
  extends SearchFilterBaseDefinition<TOperators> {
  fieldType: IntrinsicTypeName
  type: 'field'
}

export interface SearchFilterPinnedDefinition<TOperators = string>
  extends SearchFilterBaseDefinition<TOperators> {
  fieldPath?: string
  group?: string
  title: string
  type: 'pinned'
}

/**
 * @beta
 */
export type SearchFilterDefinition<TOperators = string> =
  | SearchFilterFieldDefinition<TOperators>
  | SearchFilterPinnedDefinition<TOperators>

/**
 * @internal
 */
export function createFilterDefinitionDictionary(
  filterDefinitions: SearchFilterDefinition[]
): SearchFilterDefinitionDictionary {
  return filterDefinitions.reduce<SearchFilterDefinitionDictionary>((acc, val) => {
    acc[val.name] = val
    return acc
  }, {})
}

/**
 * @alpha
 */
export function defineSearchFilter<TOperators = SearchOperatorType>(
  filterDef: SearchFilterDefinition<TOperators>
): typeof filterDef {
  return filterDef
}

/**
 * @alpha
 */
export function defineSearchFilterOperators<TOperators = SearchOperatorType>(
  operators: Operator<TOperators>[]
): typeof operators {
  return operators
}

export function getFilterDefinition(
  definitions: SearchFilterDefinitionDictionary,
  filterName: string
): SearchFilterDefinition | undefined {
  return definitions[filterName]
}

// TODO: we'll need to add field type to pinned filters, in order to properly infer
// supported field types in the event all field filters are disabled / override
export function getSupportedFieldTypes(filterDefs: SearchFilterDefinition[]): string[] {
  return filterDefs.reduce<string[]>((acc, val) => {
    if (val.type === 'field') {
      acc.push(val.fieldType)
    }
    return acc
  }, [])
}

/**
 * @internal
 */
export type SearchFilterDefinitionDictionary = Record<
  SearchFilterDefinition['name'],
  SearchFilterDefinition
>
