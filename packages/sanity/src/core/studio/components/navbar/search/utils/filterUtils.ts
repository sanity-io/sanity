import {getFilterDefinition, SearchFilterDefinition} from '../definitions/filters'
import {getOperator, SearchOperator} from '../definitions/operators'
import type {SearchFieldDefinition, SearchFilter} from '../types'

export function createFilterFromDefinition(filterDefinition: SearchFilterDefinition): SearchFilter {
  return {
    filterName: filterDefinition.name,
  }
}

export function createFilterFromField(field: SearchFieldDefinition): SearchFilter {
  return {
    fieldId: field.id,
    filterName: field.filterName,
  }
}

export function getFieldFromFilter(
  fields: SearchFieldDefinition[],
  filter: SearchFilter
): SearchFieldDefinition | undefined {
  return fields.find((field) => field.id === filter?.fieldId)
}

export function getFilterKey(filter: SearchFilter): string {
  return [filter.filterName, ...(filter.fieldId ? [filter.fieldId] : [])].join('-')
}

/**
 * Check if a filter is 'complete' / has a value that can be used in a GROQ query.
 */
export function isFilterComplete(
  filter: SearchFilter,
  filterDefinitions: SearchFilterDefinition[],
  fieldDefinitions: SearchFieldDefinition[],
  operatorDefinitions: SearchOperator[]
): boolean {
  const filterDef = getFilterDefinition(filterDefinitions, filter.filterName)
  if (!filterDef) {
    return false
  }

  const field = getFieldFromFilter(fieldDefinitions, filter)
  const operator = getOperator(operatorDefinitions, filter.operatorType)
  const hasFilterValue = operator?.fn({
    fieldPath: filterDef.type === 'pinned' ? filterDef.fieldPath : field?.fieldPath,
    value: filter.value,
  })
  return operator?.inputComponent ? !!(filter.operatorType && hasFilterValue) : true
}

/**
 * Validate if the supplied filter:
 * - has a valid filter defintion
 * - has a valid field definition (if it references a fieldId)
 * - has a valid operator (if present)
 */
export function validateFilter(
  filter: SearchFilter,
  filterDefinitions: SearchFilterDefinition[],
  fieldDefinitions: SearchFieldDefinition[]
): boolean {
  const filterDef = getFilterDefinition(filterDefinitions, filter.filterName)

  // No matching filter definition
  if (!filterDef) {
    return false
  }

  // No matching field definition
  if (filter.fieldId) {
    if (!fieldDefinitions.find((f) => f.id === filter.fieldId)) {
      return false
    }
  }

  // No matching operator
  if (filter.operatorType) {
    if (!filterDef.operators.find((o) => o.type === 'item' && o.name === filter.operatorType)) {
      return false
    }
  }

  // Field filter: missing `fieldId`
  if (filterDef.type === 'field') {
    if (!filter.fieldId) {
      return false
    }
  }

  // Pinned filter: missing `fieldId`
  if (filterDef.type === 'pinned') {
    if (!filter.fieldId && filterDef.fieldPath) {
      return false
    }
  }

  return true
}
