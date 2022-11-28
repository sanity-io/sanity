import {Schema} from '@sanity/types'
import {ButtonTone} from '@sanity/ui'
import {difference, startCase} from 'lodash'
import {SearchableType} from '../../../../../../../search'
import {
  getFilterDefinition,
  SearchFilterDefinition,
  SearchFilterPinnedDefinition,
} from '../../../definitions/filters'
import {
  FilterMenuItem,
  FilterMenuItemFilter,
  FilterMenuItemHeader,
  SearchFieldDefinition,
  SearchFilter,
} from '../../../types'
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
  // TODO: refactor
  const ungroupedPinnedFilters = filterDefinitions
    .filter(
      (filterDef): filterDef is SearchFilterPinnedDefinition =>
        filterDef.type === 'pinned' && typeof filterDef?.group === 'undefined'
    )
    .filter((filterDef) => includesTitleInPinnedFilterDefinition(filterDef, titleFilter))
    .map(createFilterFromDefinition)

  // Extract pinned filters into groups
  const groupedPinnedFilters = filterDefinitions
    .filter(
      (filterDef): filterDef is SearchFilterPinnedDefinition & {group: string} =>
        filterDef.type === 'pinned' && typeof filterDef?.group !== 'undefined'
    )
    .filter((filterDef) => includesTitleInPinnedFilterDefinition(filterDef, titleFilter))
    .reduce<Record<string, SearchFilter[]>>((acc, val) => {
      acc[val.group] = acc[val.group] || []
      acc[val.group].push(createFilterFromDefinition(val))
      return acc
    }, {})

  const pinnedGroups = Object.entries(groupedPinnedFilters).flatMap(([groupTitle, filters]) => {
    return filterGroup({
      fieldDefinitions,
      filterDefinitions,
      filters,
      headerTitle: groupTitle,
      id: groupTitle,
      tone: 'primary',
    })
  })

  const fieldFilters = fieldDefinitions
    .filter((filter) => includesTitleInFieldDefinition(filter, titleFilter))
    .map(createFilterFromField)

  if (documentTypesNarrowed.length === 0) {
    return [
      ...filterGroup({
        fieldDefinitions,
        filterDefinitions,
        filters: ungroupedPinnedFilters,
        id: 'pinned',
        tone: 'primary',
      }),
      ...pinnedGroups,
      ...filterGroup({
        fieldDefinitions,
        filterDefinitions,
        filters: fieldFilters,
        headerTitle: 'All fields',
        id: 'field',
      }),
    ]
  }

  const sharedFilters = fieldFilters.filter((filter) => {
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
      const groupFilters = fieldFilters.filter((filter) => {
        const fieldDefinition = getFieldFromFilter(fieldDefinitions, filter)
        return includesDocumentTypes([documentType], fieldDefinition)
      })
      return filterGroup({
        fieldDefinitions,
        filterDefinitions,
        filters: groupFilters,
        id: title,
        headerTitle: title,
      })
    })
    .flat()

  return [
    ...filterGroup({
      fieldDefinitions,
      filterDefinitions,
      filters: ungroupedPinnedFilters,
      id: 'pinned',
      tone: 'primary',
    }),
    ...pinnedGroups,
    ...(documentTypesNarrowed.length > 1 && types.length > 1
      ? filterGroup({
          fieldDefinitions,
          filterDefinitions,
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
  filterDefinitions,
  filters,
  id,
  headerTitle,
  tone,
}: {
  fieldDefinitions: SearchFieldDefinition[]
  filterDefinitions: SearchFilterDefinition[]
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
        fieldDefinition: getFieldFromFilter(fieldDefinitions, filter),
        filterDefinition: getFilterDefinition(filterDefinitions, filter.filterType),
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

function includesTitleInPinnedFilterDefinition(
  filter: SearchFilterPinnedDefinition,
  currentTitle: string
) {
  return filter.title.toLowerCase().includes(currentTitle.toLowerCase())
}

function sharesDocumentTypes(documentTypes: string[], fieldDefinition?: SearchFieldDefinition) {
  return difference(documentTypes, fieldDefinition?.documentTypes || []).length === 0
}
