import intersection from 'lodash/intersection'
import isEmpty from 'lodash/isEmpty'
import type {SearchableType} from '../../../../../search'
import {isNonNullable} from '../../../../../util'
import {getFilterDefinition, OperatorItem, SearchFilterDefinition} from '../definitions/filters'
import {getOperatorDefinition, SearchOperatorDefinition} from '../definitions/operators'
import type {SearchFieldDefinition, SearchFilter} from '../types'

export function buildSearchFilter(
  filterDefinition: SearchFilterDefinition,
  fieldId?: string
): SearchFilter {
  return {
    fieldId,
    filterName: filterDefinition.name,
    operatorType:
      filterDefinition?.operators.find((operator): operator is OperatorItem => {
        return operator.type === 'item'
      })?.name || '',
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
      return getOperatorDefinition(operatorDefinitions, filter.operatorType)?.groqFilter({
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

  // Fail: No matching operator
  if (!operatorDef) {
    return false
  }

  // Fail: No matching field definition
  if (filter.fieldId) {
    if (!fieldDef) {
      return false
    }
  }

  // Field filters:
  if (filterDef.type === 'field') {
    // Fail: field definition has invalid path
    if (!fieldDef?.fieldPath) {
      return false
    }
    // Fail: no field ID
    if (!filter.fieldId) {
      return false
    }
    // Fail: no filter value
    const hasFilterValue = operatorDef.groqFilter({
      fieldPath: fieldDef.fieldPath,
      value: filter.value,
    })
    if (!hasFilterValue) {
      return false
    }
  }

  // Pinned filters:
  if (filterDef.type === 'pinned') {
    // Fail: no filter value
    const hasFilterValue = operatorDef.groqFilter({
      fieldPath: filterDef.fieldPath,
      value: filter.value,
    })
    if (!hasFilterValue) {
      return false
    }
  }

  return true
}
