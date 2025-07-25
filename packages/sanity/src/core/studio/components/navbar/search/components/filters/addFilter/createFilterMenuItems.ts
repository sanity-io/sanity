import {type Schema, type SchemaType} from '@sanity/types'
import {type ButtonTone} from '@sanity/ui'
import {difference, startCase} from 'lodash'

import {type TFunction} from '../../../../../../../i18n'
import {isNonNullable} from '../../../../../../../util'
import {
  type SearchFieldDefinition,
  type SearchFieldDefinitionDictionary,
} from '../../../definitions/fields'
import {
  getFilterDefinition,
  type SearchFilterDefinition,
  type SearchFilterDefinitionDictionary,
  type SearchFilterPinnedDefinition,
} from '../../../definitions/filters'
import {
  type FilterMenuItem,
  type FilterMenuItemFilter,
  type FilterMenuItemHeader,
  type SearchFilter,
} from '../../../types'
import {buildSearchFilter, getFieldFromFilter} from '../../../utils/filterUtils'

/**
 * Creates a flat list of filter menu items based on the current filter text input.
 */
export function createFilterMenuItems({
  documentTypesNarrowed,
  fieldDefinitions,
  filterDefinitions,
  schema,
  titleFilter,
  types,
  t,
}: {
  documentTypesNarrowed: string[]
  fieldDefinitions: SearchFieldDefinitionDictionary
  filterDefinitions: SearchFilterDefinitionDictionary
  schema: Schema
  titleFilter: string
  types: SchemaType[]
  t: TFunction<'studio', undefined>
}): FilterMenuItem[] {
  // Construct field filters based on available definitions and current title fitler
  const fieldFilters = Object.values(fieldDefinitions)
    .filter((fieldDef) => includesTitleInFieldDefinition(fieldDef, titleFilter))
    .map((fieldDef) => {
      const filterDef = getFilterDefinition(filterDefinitions, fieldDef.filterName)
      if (filterDef) {
        return buildSearchFilter(filterDef, fieldDef.id)
      }
      return null
    })
    .filter(isNonNullable)

  const pinnedItems = buildPinnedMenuItems({
    fieldDefinitions,
    filterDefinitions,
    titleFilter,
  })

  if (documentTypesNarrowed.length === 0) {
    return [
      ...pinnedItems,
      // All fields
      ...filterGroup({
        fieldDefinitions,
        filterDefinitions,
        filters: fieldFilters,
        headerTitle: t('search.filter-all-fields-header'),
        id: 'field',
      }),
    ]
  }

  return [
    ...pinnedItems,
    // All shared / narrowed items
    ...buildFieldMenuItemsNarrowed({
      documentTypesNarrowed,
      fieldDefinitions,
      filterDefinitions,
      filters: fieldFilters,
      schema,
      types,
      t,
    }),
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
  fieldDefinitions: SearchFieldDefinitionDictionary
  filterDefinitions: SearchFilterDefinitionDictionary
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
        filterDefinition: getFilterDefinition(filterDefinitions, filter.filterName),
        filter,
        group: id,
        tone: tone || 'default',
        type: 'filter',
      }) as FilterMenuItemFilter,
  )

  return filterItems.length > 0
    ? [
        ...(headerTitle ? [header] : []), //
        ...filterItems,
      ]
    : []
}

/**
 * Construct a flat list of narrowed field menu items, including shared fields.
 * Shared fields should always appear first.
 */
function buildFieldMenuItemsNarrowed({
  documentTypesNarrowed,
  fieldDefinitions,
  filterDefinitions,
  filters,
  schema,
  types,
  t,
}: {
  documentTypesNarrowed: string[]
  fieldDefinitions: SearchFieldDefinitionDictionary
  filterDefinitions: SearchFilterDefinitionDictionary
  filters: SearchFilter[]
  schema: Schema
  types: SchemaType[]
  t: TFunction<'studio', undefined>
}) {
  const sharedFilters = filters.filter((filter) => {
    const fieldDefinition = getFieldFromFilter(fieldDefinitions, filter)
    return sharesDocumentTypes(documentTypesNarrowed, fieldDefinition)
  })

  const sharedItems =
    documentTypesNarrowed.length > 1 && types.length > 1
      ? filterGroup({
          fieldDefinitions,
          filterDefinitions,
          filters: sharedFilters,
          headerTitle: t('search.filter-shared-fields-header'),
          id: 'shared',
          tone: 'primary',
        })
      : []

  const groupedItems = documentTypesNarrowed
    .map((documentType) => {
      const docType = schema.get(documentType)
      return {
        // Note: it shouldn't be possible to select document types that do not exist in schema,
        // and there is no way to inject it into state (eg not persisted in URL), thus we leave
        // this fallback (`Unknown type`) only as a edge-case safety net and will not translate it.
        title: docType?.title || startCase(docType?.name) || '(Unknown type)',
        documentType,
      }
    })
    // Sort groups by title
    .sort((a, b) => a.title.localeCompare(b.title))
    .flatMap(({documentType, title}) => {
      const groupFilters = filters.filter((filter) => {
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

  return [...sharedItems, ...groupedItems]
}

/**
 * Construct a flat list of all pinned filter menu items (both ungrouped and grouped).
 * Un-grouped items should always appear first.
 */
function buildPinnedMenuItems({
  fieldDefinitions,
  filterDefinitions,
  titleFilter,
}: {
  fieldDefinitions: SearchFieldDefinitionDictionary
  filterDefinitions: SearchFilterDefinitionDictionary
  titleFilter: string
}) {
  // Extract all ungrouped pinned filters, these sit above all other items.
  const ungroupedPinnedFilters = Object.values(filterDefinitions)
    .filter(isPinnedFilterDefWithoutGroup)
    .filter((filterDef) => includesTitleInPinnedFilterDefinition(filterDef, titleFilter))
    .map((filterDef) => buildSearchFilter(filterDef))

  // Extract grouped pinned filters
  const groupedPinnedFilters = Object.values(filterDefinitions)
    .filter(isPinnedFilterDefWithGroup)
    .filter((filterDef) => includesTitleInPinnedFilterDefinition(filterDef, titleFilter))
    .reduce<Record<string, SearchFilter[]>>((acc, val) => {
      acc[val.group] = acc[val.group] || []
      acc[val.group].push(buildSearchFilter(val))
      return acc
    }, {})

  return [
    // Ungrouped
    ...filterGroup({
      fieldDefinitions,
      filterDefinitions,
      filters: ungroupedPinnedFilters,
      id: 'pinned-ungrouped',
      tone: 'primary',
    }),
    // Grouped
    ...Object.entries(groupedPinnedFilters).flatMap(([groupTitle, filters]) =>
      filterGroup({
        fieldDefinitions,
        filterDefinitions,
        filters,
        headerTitle: groupTitle,
        id: groupTitle,
        tone: 'primary',
      }),
    ),
  ]
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
  currentTitle: string,
) {
  return filter.title.toLowerCase().includes(currentTitle.toLowerCase())
}

function isPinnedFilterDefWithGroup(
  filterDef: SearchFilterDefinition,
): filterDef is SearchFilterPinnedDefinition & {group: string} {
  return filterDef.type === 'pinned' && typeof filterDef?.group !== 'undefined'
}

function isPinnedFilterDefWithoutGroup(
  filterDef: SearchFilterDefinition,
): filterDef is SearchFilterPinnedDefinition {
  return filterDef.type === 'pinned' && typeof filterDef?.group === 'undefined'
}

function sharesDocumentTypes(documentTypes: string[], fieldDefinition?: SearchFieldDefinition) {
  return difference(documentTypes, fieldDefinition?.documentTypes || []).length === 0
}
