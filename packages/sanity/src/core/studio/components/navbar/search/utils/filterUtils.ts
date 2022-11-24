import {SearchFilterDefinition} from '../definitions/filters'
import {getOperator, SearchOperator} from '../definitions/operators'
import type {SearchFieldDefinition, SearchFilter} from '../types'

export function createFilterFromDefinition(filterDefinition: SearchFilterDefinition): SearchFilter {
  return {
    filterType: filterDefinition.type,
  }
}

export function createFilterFromField(field: SearchFieldDefinition): SearchFilter {
  return {
    fieldId: field.id,
    filterType: field.filterType,
  }
}

export function getFieldFromFilter(
  fields: SearchFieldDefinition[],
  filter: SearchFilter
): SearchFieldDefinition | undefined {
  return fields.find((field) => field.id === filter?.fieldId)
}

export function getFilterKey(filter: SearchFilter): string {
  return [filter.filterType, ...(filter.fieldId ? [filter.fieldId] : [])].join('-')
}

/**
 * Check if a filter is 'complete' / has a value that can be used in a GROQ query.
 */
export function isFilterComplete(
  filter: SearchFilter,
  fieldDefinitions: SearchFieldDefinition[],
  operatorDefinitions: SearchOperator[]
): boolean {
  const field = getFieldFromFilter(fieldDefinitions, filter)
  const operator = getOperator(operatorDefinitions, filter.operatorType)
  const hasFilterValue = operator?.fn({
    fieldPath: field?.fieldPath,
    value: filter.value,
  })
  return operator?.inputComponent ? !!(filter.operatorType && hasFilterValue) : true
}
