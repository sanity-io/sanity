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

/**
 * @alpha
 */
export interface SearchFilterDefinition<TOperators = SearchOperatorType> {
  description?: string
  fieldType?: IntrinsicTypeName
  icon: ComponentType
  operators: Operator<TOperators>[]
  title: string
  type: string
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
  definitions: SearchFilterDefinition[],
  filterType: string
): SearchFilterDefinition | undefined {
  return definitions.find((filter) => filter.type === filterType)
}

export function getFilterDefinitionInitialOperatorType(
  definitions: SearchFilterDefinition[],
  filterName: string
): SearchOperatorType | undefined {
  const filterDefinition = getFilterDefinition(definitions, filterName)
  return filterDefinition?.operators.find(isOperatorItem)?.name
}

export function getSupportedFieldTypes(definitions: SearchFilterDefinition[]): string[] {
  return definitions.reduce<string[]>((acc, val) => {
    if (val?.fieldType) {
      acc.push(val.fieldType)
    }
    return acc
  }, [])
}

function isOperatorItem(operator: Operator): operator is OperatorItem {
  return operator.type === 'item'
}
