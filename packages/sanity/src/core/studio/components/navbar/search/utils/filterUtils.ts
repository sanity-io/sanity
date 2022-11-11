import {SearchFilterDefinition} from '../definitions/filters'
import type {ResolvedField, SearchFilter, StoredSearchFilter} from '../types'

export function createFilterFromDefinition(filterDefinition: SearchFilterDefinition): SearchFilter {
  return {
    documentTypes: [],
    filterType: filterDefinition.type,
    titlePath: [],
  }
}

export function createFilterFromField(field: ResolvedField): SearchFilter {
  return {
    documentTypes: field.documentTypes,
    fieldPath: field.fieldPath,
    filterType: field.filterType,
    titlePath: field.titlePath,
  }
}

export function expandStoredSearchFilter(
  fields: ResolvedField[],
  filter: StoredSearchFilter
): SearchFilter {
  const field = getFieldFromFilter(fields, filter)

  if (field) {
    return {
      ...createFilterFromField(field),
      operatorType: filter.operatorType,
      value: filter.value,
    }
  }

  return {
    ...filter,
    documentTypes: [],
    titlePath: [],
  }
}

export function getFieldFromFilter(
  fields: ResolvedField[],
  filter: SearchFilter | StoredSearchFilter
): ResolvedField | undefined {
  return fields.find(
    (field) => field.filterType === filter.filterType && field.fieldPath === filter.fieldPath
  )
}

export function getFilterKey(filter: SearchFilter): string {
  return [filter.filterType, ...(filter.fieldPath ? [filter.fieldPath] : [])].join('-')
}
