import {IntrinsicTypeName} from '@sanity/types'
import {ComponentType} from 'react'
import {SearchOperatorType} from './operators/defaultOperators'

export interface SearchFilterDefinition<TOperator = SearchOperatorType> {
  fieldType: IntrinsicTypeName | 'email' | null
  icon: ComponentType
  initialOperator: TOperator
  operators: (
    | {
        type: 'divider'
      }
    | {
        name: TOperator
        type: 'item'
      }
  )[]
  title: string
  type: string
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
