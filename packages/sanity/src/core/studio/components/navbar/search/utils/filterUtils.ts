import {getFilterDefinition, SearchFilterDefinition} from '../definitions/filters'
import {getOperator, SearchOperatorDefinition} from '../definitions/operators'
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
 * Validate if the supplied filter:
 * - has a valid filter defintion
 * - has a valid field definition (if it references a fieldId)
 * - has a valid operator (if present)
 */
export function validateFilter({
  filter,
  filterDefinitions,
  fieldDefinitions,
  operatorDefinitions,
}: {
  filter: SearchFilter
  filterDefinitions: SearchFilterDefinition[]
  fieldDefinitions: SearchFieldDefinition[]
  operatorDefinitions: SearchOperatorDefinition[]
}): boolean {
  const filterDef = getFilterDefinition(filterDefinitions, filter.filterName)
  const operator = getOperator(operatorDefinitions, filter.operatorType)
  const fieldDef = getFieldFromFilter(fieldDefinitions, filter)

  // Fail: No matching filter definition
  if (!filterDef) {
    return false
  }

  // Fail: No matching field definition
  if (filter.fieldId) {
    if (!fieldDef) {
      return false
    }
  }

  // Fail: No matching operator
  if (filter.operatorType) {
    if (!operator) {
      return false
    }
  }

  // Fail: Field filter is missing `fieldId`
  if (filterDef.type === 'field') {
    if (!filter.fieldId) {
      return false
    }
  }

  // Fail: Pinned filter is missing `fieldId`
  if (filterDef.type === 'pinned') {
    if (!filter.fieldId && filterDef.fieldPath) {
      return false
    }
  }

  // Fail: Filter query returns null
  if (operator?.inputComponent) {
    const hasFilterValue = operator?.fn({
      fieldPath: filterDef.type === 'pinned' ? filterDef.fieldPath : fieldDef?.fieldPath,
      value: filter.value,
    })
    return !!(filter.operatorType && hasFilterValue)
  }

  return true
}
