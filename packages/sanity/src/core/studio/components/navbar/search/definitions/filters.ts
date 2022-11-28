import {IntrinsicTypeName} from '@sanity/types'
import {ComponentType} from 'react'
import {SearchOperatorType} from './operators/defaultOperators'

type Operator<TOperators = SearchOperatorType> = OperatorDivider | OperatorItem<TOperators>

type OperatorDivider = {
  type: 'divider'
}

type OperatorItem<TOperators = SearchOperatorType> = {
  name: TOperators
  type: 'item'
}

interface SearchFieldBaseDefinition<TOperators> {
  description?: string
  icon: ComponentType
  name: string
  operators: Operator<TOperators>[]
}

export interface SearchFilterFieldDefinition<TOperators = SearchOperatorType>
  extends SearchFieldBaseDefinition<TOperators> {
  fieldType: IntrinsicTypeName
  type: 'field'
}

export interface SearchFilterPinnedDefinition<TOperators = SearchOperatorType>
  extends SearchFieldBaseDefinition<TOperators> {
  fieldPath?: string
  group?: string
  title: string
  type: 'pinned'
}

/**
 * @alpha
 */
export type SearchFilterDefinition<TOperators = SearchOperatorType> =
  | SearchFilterFieldDefinition<TOperators>
  | SearchFilterPinnedDefinition<TOperators>

/**
 * @alpha
 */

export function defineSearchFilter(filterDef: SearchFilterDefinition): typeof filterDef {
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
  definitions: SearchFilterDefinition[],
  filterType: string
): SearchFilterDefinition | undefined {
  return definitions.find((filter) => filter.name === filterType)
}

export function getFilterDefinitionInitialOperatorType(
  definitions: SearchFilterDefinition[],
  filterName: string
): SearchOperatorType | undefined {
  const filterDefinition = getFilterDefinition(definitions, filterName)
  return filterDefinition?.operators.find(isOperatorItem)?.name
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

function isOperatorItem(operator: Operator): operator is OperatorItem {
  return operator.type === 'item'
}
