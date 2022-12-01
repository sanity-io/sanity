import intersection from 'lodash/intersection'
import isEmpty from 'lodash/isEmpty'
import type {SearchableType} from '../../../../../search'
import {isNonNullable} from '../../../../../util'
import {getFilterDefinition, SearchFilterDefinition} from '../definitions/filters'
import {getOperatorDefinition, SearchOperatorDefinition} from '../definitions/operators'
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

export function generateFilterQuery({
  fieldDefinitions,
  filterDefinitions,
  filters,
  operatorDefinitions,
}: {
  fieldDefinitions: SearchFieldDefinition[]
  filterDefinitions: SearchFilterDefinition[]
  filters: SearchFilter[]
  operatorDefinitions: SearchOperatorDefinition[]
}): string {
  return filters
    .filter((filter) =>
      validateFilter({
        filter,
        filterDefinitions,
        fieldDefinitions,
        operatorDefinitions,
      })
    )
    .map((filter) => {
      return getOperatorDefinition(operatorDefinitions, filter.operatorType)?.fn({
        fieldPath: resolveFieldPath({filter, fieldDefinitions, filterDefinitions}),
        value: filter?.value,
      })
    })
    .filter((filter) => !isEmpty(filter))
    .filter(isNonNullable)
    .join(' && ')
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

export function narrowDocumentTypes({
  fieldDefinitions,
  filters,
  types,
}: {
  fieldDefinitions: SearchFieldDefinition[]
  filters: SearchFilter[]
  types: SearchableType[]
}): string[] {
  // Get all 'manually' selected document types
  const selectedDocumentTypes = types.map((type) => type.name)

  const filteredDocumentTypes = fieldDefinitions
    .filter((field) => filters.map((filter) => filter?.fieldId).includes(field.id))
    .filter((field) => field.documentTypes.length > 0)
    .map((field) => field.documentTypes)

  // Get intersecting document types across all active filters (that have at least one document type).
  // Filters that have no document types (i.e. `_updatedAt` which is available to all) are ignored.
  const intersectingDocumentTypes = intersection(...filteredDocumentTypes)

  const documentTypes: string[][] = []
  if (selectedDocumentTypes.length > 0) {
    documentTypes.push(selectedDocumentTypes)
  }
  if (intersectingDocumentTypes.length > 0) {
    documentTypes.push(intersectingDocumentTypes)
  }

  return intersection(...documentTypes).sort()
}

function resolveFieldPath({
  filter,
  fieldDefinitions,
  filterDefinitions,
}: {
  filter: SearchFilter
  fieldDefinitions: SearchFieldDefinition[]
  filterDefinitions: SearchFilterDefinition[]
}): string | undefined {
  const fieldDefinition = fieldDefinitions.find((f) => f.id === filter?.fieldId)
  const filterDefinition = getFilterDefinition(filterDefinitions, filter.filterName)

  if (!filterDefinition) {
    return undefined
  }

  switch (filterDefinition.type) {
    case 'field':
      return fieldDefinition?.fieldPath
    case 'pinned':
      return filterDefinition?.fieldPath
    default:
      return undefined
  }
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
  const operatorDef = getOperatorDefinition(operatorDefinitions, filter.operatorType)
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
    if (!operatorDef) {
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
  if (operatorDef?.inputComponent) {
    const hasFilterValue = operatorDef?.fn({
      fieldPath: filterDef.type === 'pinned' ? filterDef.fieldPath : fieldDef?.fieldPath,
      value: filter.value,
    })
    return !!(filter.operatorType && hasFilterValue)
  }

  return true
}
