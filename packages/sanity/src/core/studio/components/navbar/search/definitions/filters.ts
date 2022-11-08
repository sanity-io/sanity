import {IntrinsicTypeName} from '@sanity/types'
import {ComponentType} from 'react'
import {SearchOperatorType} from './operators/defaultOperators'

type Operator<TOperators = SearchOperatorType> =
  | {
      type: 'divider'
    }
  | {
      name: TOperators
      type: 'item'
    }

/**
 * @alpha
 */
export interface SearchFilterDefinition<TOperators = string> {
  fieldType: IntrinsicTypeName | 'email' | null
  icon: ComponentType
  initialOperator: TOperators
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

export function getFilterDefinitionInitialOperator(
  definitions: SearchFilterDefinition[],
  filterName: string
): SearchFilterDefinition['initialOperator'] | undefined {
  return getFilterDefinition(definitions, filterName)?.initialOperator
}

export function getSupportedFieldTypes(definitions: SearchFilterDefinition[]): string[] {
  return definitions.reduce<string[]>((acc, val) => {
    if (val?.fieldType) {
      acc.push(val.fieldType)
    }
    return acc
  }, [])
}
