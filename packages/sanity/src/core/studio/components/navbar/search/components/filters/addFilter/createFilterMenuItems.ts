import {Schema} from '@sanity/types'
import {ButtonTone} from '@sanity/ui'
import {difference, partition, startCase} from 'lodash'
import {SearchableType} from '../../../../../../../search'
import {SearchFilterDefinition} from '../../../definitions/filters'
import {
  FilterMenuItem,
  FilterMenuItemFilter,
  FilterMenuItemHeader,
  SearchFieldDefinition,
  SearchFilter,
} from '../../../types'
import {INTERNAL_FIELDS} from '../../../utils/createFieldDefinitions'
import {
  createFilterFromDefinition,
  createFilterFromField,
  getFieldFromFilter,
} from '../../../utils/filterUtils'

/**
 * Creates a flat list of filter menu items based on the current filter text input.
 */
export function createFilterMenuItems({
  fieldDefinitions,
  filterDefinitions,
  schema,
  titleFilter,
  types,
  documentTypesNarrowed,
}: {
  fieldDefinitions: SearchFieldDefinition[]
  filterDefinitions: SearchFilterDefinition[]
  schema: Schema
  titleFilter: string
  types: SearchableType[]
  documentTypesNarrowed: string[]
}): FilterMenuItem[] {
  // Get all filter definitions without field types
  const nonFieldFilters = filterDefinitions
    .filter((filterDefinition) => !filterDefinition.fieldType)
    .filter((filterDefinition) => includesTitleInFilterDefinition(filterDefinition, titleFilter))
    .map(createFilterFromDefinition)

  const allFilters = fieldDefinitions
    .filter((filter) => includesTitleInFieldDefinition(filter, titleFilter))
    .sort(sortByInternalFieldName)
    .map(createFilterFromField)

  const [internalFieldFilters, otherFieldFilters] = partition(allFilters, (filter) => {
    const fieldDefinition = getFieldFromFilter(fieldDefinitions, filter)
    return fieldDefinition?.fieldPath?.startsWith('_')
  })

  if (documentTypesNarrowed.length === 0) {
    return [
      ...filterGroup({
        fieldDefinitions,
        filters: internalFieldFilters,
        id: 'internal',
        tone: 'primary',
      }),
      ...filterGroup({
        fieldDefinitions,
        filters: nonFieldFilters,
        id: 'non-field',
        tone: 'primary',
      }),
      ...filterGroup({
        fieldDefinitions,
        filters: otherFieldFilters,
        headerTitle: 'All fields',
        id: 'all-fields',
      }),
    ]
  }

  const sharedFilters = otherFieldFilters.filter((filter) => {
    const fieldDefinition = getFieldFromFilter(fieldDefinitions, filter)
    return sharesDocumentTypes(documentTypesNarrowed, fieldDefinition)
  })

  const groupedItems = documentTypesNarrowed
    .map((documentType) => {
      const docType = schema.get(documentType)
      return {
        title: docType?.title || startCase(docType?.name) || '(Unknown type)',
        documentType,
      }
    })
    // Sort groups by title
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(({documentType, title}) => {
      const groupFilters = otherFieldFilters.filter((filter) => {
        const fieldDefinition = getFieldFromFilter(fieldDefinitions, filter)
        return includesDocumentTypes([documentType], fieldDefinition)
      })
      return filterGroup({fieldDefinitions, filters: groupFilters, id: title, headerTitle: title})
    })
    .flat()

  return [
    ...filterGroup({
      fieldDefinitions,
      filters: internalFieldFilters,
      id: 'internal',
      tone: 'primary',
    }),
    ...filterGroup({fieldDefinitions, filters: nonFieldFilters, id: 'non-field', tone: 'primary'}),
    ...(documentTypesNarrowed.length > 1 && types.length > 1
      ? filterGroup({
          fieldDefinitions,
          filters: sharedFilters,
          headerTitle: 'Shared fields',
          id: 'shared',
          tone: 'primary',
        })
      : []),
    ...groupedItems,
  ]
}

function filterGroup({
  fieldDefinitions,
  filters,
  id,
  headerTitle,
  tone,
}: {
  fieldDefinitions: SearchFieldDefinition[]
  filters: SearchFilter[]
  id: string
  headerTitle?: string
  tone?: ButtonTone
}): FilterMenuItem[] {
  const header: FilterMenuItemHeader = {
    title: headerTitle || '',
    tone: tone || 'default',
    type: 'header',
  }
  const filterItems = filters.map(
    (filter) =>
      ({
        field: getFieldFromFilter(fieldDefinitions, filter),
        filter,
        group: id,
        tone: tone || 'default',
        type: 'filter',
      } as FilterMenuItemFilter)
  )

  return filterItems.length > 0
    ? [
        ...(headerTitle ? [header] : []), //
        ...filterItems,
      ]
    : []
}

function includesDocumentTypes(documentTypes: string[], fieldDefinition?: SearchFieldDefinition) {
  return fieldDefinition?.documentTypes.some((type) => documentTypes.includes(type))
}

function includesTitleInFieldDefinition(field: SearchFieldDefinition, currentTitle: string) {
  const fieldTitle = field.titlePath.join('/')
  return fieldTitle.toLowerCase().includes(currentTitle.toLowerCase())
}

function includesTitleInFilterDefinition(filter: SearchFilterDefinition, currentTitle: string) {
  return filter.title.toLowerCase().includes(currentTitle.toLowerCase())
}

function sharesDocumentTypes(documentTypes: string[], fieldDefinition?: SearchFieldDefinition) {
  return difference(documentTypes, fieldDefinition?.documentTypes || []).length === 0
}

function sortByInternalFieldName(a: SearchFieldDefinition, b: SearchFieldDefinition) {
  return (
    INTERNAL_FIELDS.findIndex((f) => f.name === a.fieldPath) -
    INTERNAL_FIELDS.findIndex((f) => f.name === b.fieldPath)
  )
}
