import {SearchFilterDefinition} from '../definitions/filters'
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
