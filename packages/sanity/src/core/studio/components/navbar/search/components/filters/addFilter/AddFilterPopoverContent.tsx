/* eslint-disable max-nested-callbacks */
import {SearchIcon} from '@sanity/icons'
import {Schema} from '@sanity/types'
import {Box, ButtonTone, Flex, Text} from '@sanity/ui'
import {partition} from 'lodash'
import difference from 'lodash/difference'
import isEqual from 'lodash/isEqual'
import startCase from 'lodash/startCase'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../../hooks'
import {SUBHEADER_HEIGHT_SMALL} from '../../../constants'
import {CommandListProvider} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition, SearchFilterDefinition} from '../../../definitions/filters'
import type {
  SearchFilter,
  SearchFilterMenuItem,
  SearchFilterMenuItemFilter,
  SearchFilterMenuItemHeader,
} from '../../../types'
import {INTERNAL_FIELDS} from '../../../utils/createFieldRegistry'
import {createFilterFromDefinition, createFilterFromField} from '../../../utils/filterUtils'
import {CustomTextInput} from '../../common/CustomTextInput'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {AddFilterContentMenuItems} from './AddFilterContentMenuItems'

interface AddFilterPopoverContentProps {
  onClose: () => void
}

const FilterHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const FilterHeaderContentFlex = styled(Flex)`
  box-sizing: border-box;
  height: ${SUBHEADER_HEIGHT_SMALL};
`

export function AddFilterPopoverContent({onClose}: AddFilterPopoverContentProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)
  const [titleFilter, setTitleFilter] = useState('')

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTitleFilter(e.currentTarget.value),
    [setTitleFilter]
  )
  const handleFilterClear = useCallback(() => setTitleFilter(''), [])

  const filterListId = useId()

  const schema = useSchema()

  const {
    state: {definitions},
  } = useSearchState()

  const filteredMenuItems = useCreateFilteredMenuItems(definitions.filters, schema, titleFilter)

  return (
    <FilterPopoverWrapper onClose={onClose}>
      <Flex
        style={{
          maxHeight: '600px',
          maxWidth: '350px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <CommandListProvider
          ariaChildrenLabel="Filters"
          ariaHeaderLabel="Filter by title"
          childCount={filteredMenuItems.length}
          childContainerElement={childContainerElement}
          containerElement={containerElement}
          headerInputElement={headerInputElement}
          id={filterListId}
          level={1}
          pointerOverlayElement={pointerOverlayElement}
        >
          <Flex direction="column" ref={setContainerRef} style={{width: '300px'}}>
            {/* Filter header */}
            <FilterHeaderBox>
              <FilterHeaderContentFlex align="center" flex={1} padding={1}>
                <CustomTextInput
                  autoComplete="off"
                  border={false}
                  clearButton={!!titleFilter}
                  fontSize={1}
                  icon={SearchIcon}
                  muted
                  onChange={handleFilterChange}
                  onClear={handleFilterClear}
                  placeholder="Filter"
                  ref={setHeaderInputRef}
                  smallClearButton
                  spellCheck={false}
                  radius={2}
                  value={titleFilter}
                />
              </FilterHeaderContentFlex>
            </FilterHeaderBox>

            <Box flex={1}>
              {filteredMenuItems.length > 0 && (
                <AddFilterContentMenuItems
                  menuItems={filteredMenuItems}
                  onClose={onClose}
                  setChildContainerRef={setChildContainerRef}
                  setPointerOverlayRef={setPointerOverlayRef}
                />
              )}

              {/* No results */}
              {filteredMenuItems.length == 0 && (
                <Box padding={3}>
                  <Text muted size={1} textOverflow="ellipsis">
                    No matches for '{titleFilter}'
                  </Text>
                </Box>
              )}
            </Box>
          </Flex>
        </CommandListProvider>
      </Flex>
    </FilterPopoverWrapper>
  )
}

/**
 * Creates a flat list of filter menu items based on the current filter text input.
 */
function useCreateFilteredMenuItems(
  searchDefinitions: SearchFilterDefinition[],
  schema: Schema,
  titleFilter: string
): SearchFilterMenuItem[] {
  const {
    fieldRegistry,
    state: {
      documentTypesNarrowed,
      terms: {types},
      definitions,
    },
  } = useSearchState()

  return useMemo(() => {
    // Get all filter definitions without field types
    const nonFieldFilters = searchDefinitions
      .filter((searchDefinition) => !searchDefinition.fieldType)
      .map(createFilterFromDefinition)
      .filter((searchFilter) => includesFilterTitle(definitions.filters, searchFilter, titleFilter))

    const allFilters = fieldRegistry
      .map(createFilterFromField)
      .filter((searchFilter) => includesFilterTitle(definitions.filters, searchFilter, titleFilter))

    const [internalFieldFilters, otherFieldFilters] = partition(allFilters, (filter) =>
      filter?.fieldPath?.startsWith('_')
    )

    const sortedInternalFieldFilters = internalFieldFilters.sort(sortByInternalFieldName)

    if (documentTypesNarrowed.length === 0) {
      return [
        ...filterGroup({filters: sortedInternalFieldFilters, id: 'internal', tone: 'primary'}),
        ...filterGroup({filters: nonFieldFilters, id: 'non-field', tone: 'primary'}),
        ...filterGroup({filters: otherFieldFilters, headerTitle: 'All fields', id: 'all-fields'}),
      ]
    }

    const sharedFilters = otherFieldFilters.filter((searchFilter) =>
      sharesDocumentTypes(documentTypesNarrowed, searchFilter)
    )

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
        const groupFilters = otherFieldFilters.filter((searchFilter) =>
          includesDocumentTypes([documentType], searchFilter)
        )
        return filterGroup({filters: groupFilters, id: title, headerTitle: title})
      })
      .flat()

    return [
      ...filterGroup({filters: sortedInternalFieldFilters, id: 'internal', tone: 'primary'}),
      ...filterGroup({filters: nonFieldFilters, id: 'non-field', tone: 'primary'}),
      ...(documentTypesNarrowed.length > 1 && types.length > 1
        ? filterGroup({
            filters: sharedFilters,
            headerTitle: 'Shared fields',
            id: 'shared',
            tone: 'primary',
          })
        : []),
      ...groupedItems,
    ]
  }, [
    definitions.filters,
    documentTypesNarrowed,
    fieldRegistry,
    schema,
    searchDefinitions,
    titleFilter,
    types.length,
  ])
}

function filterGroup({
  filters,
  id,
  headerTitle,
  tone,
}: {
  filters: SearchFilter[]
  id: string
  headerTitle?: string
  tone?: ButtonTone
}): SearchFilterMenuItem[] {
  const header: SearchFilterMenuItemHeader = {
    title: headerTitle || '',
    tone: tone || 'default',
    type: 'header',
  }
  const filterItems = filters
    .map(
      (filter) =>
        ({
          filter,
          group: id,
          tone: tone || 'default',
          type: 'filter',
        } as SearchFilterMenuItemFilter)
    )
    .map(mapDuplicatedTitles)

  return filterItems.length > 0
    ? [
        ...(headerTitle ? [header] : []), //
        ...filterItems,
      ]
    : []
}

function includesDocumentTypes(documentTypes: string[], searchFilter: SearchFilter) {
  return searchFilter.documentTypes.some((type) => documentTypes.includes(type))
}

function includesFilterTitle(
  filters: SearchFilterDefinition[],
  searchFilter: SearchFilter,
  currentTitle: string
) {
  const filterDef = getFilterDefinition(filters, searchFilter.filterType)
  if (!filterDef) {
    return false
  }

  let title = ''
  if (filterDef?.fieldType) {
    title = searchFilter.titlePath.join('/')
  } else {
    title = filterDef?.title
  }
  return title.toLowerCase().includes(currentTitle.toLowerCase())
}

function mapDuplicatedTitles(
  menuItem: SearchFilterMenuItemFilter,
  _index: number,
  allMenuItems: SearchFilterMenuItemFilter[]
): SearchFilterMenuItemFilter {
  const hasDuplicateTitle =
    allMenuItems.filter((f) => isEqual(f.filter.titlePath, menuItem.filter.titlePath)).length > 1

  return {
    ...menuItem,
    ...(hasDuplicateTitle ? {showSubtitle: hasDuplicateTitle} : {}),
  }
}

function sortByInternalFieldName(a: SearchFilter, b: SearchFilter) {
  return (
    INTERNAL_FIELDS.findIndex((f) => f.name === a.fieldPath) -
    INTERNAL_FIELDS.findIndex((f) => f.name === b.fieldPath)
  )
}

function sharesDocumentTypes(documentTypes: string[], searchFilter: SearchFilter) {
  return difference(documentTypes, searchFilter.documentTypes || []).length === 0
}
