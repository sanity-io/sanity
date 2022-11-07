/* eslint-disable max-nested-callbacks */
import {SearchIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {difference, isEqual} from 'lodash'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {SUBHEADER_HEIGHT_SMALL} from '../../../constants'
import {CommandListProvider} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../definitions/filters'
import type {SearchFilterMenuItem, SearchFilter} from '../../../types'
import {generateKey} from '../../../utils/generateKey'
import {CustomTextInput} from '../../CustomTextInput'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {AddFilterContentMenuItems} from './AddFilterContentMenuItems'

interface AddFilterPopoverContentProps {
  onClose: () => void
}

const COMMON_FILTERS: SearchFilter[] = [
  {
    _key: generateKey(),
    documentTypes: [],
    fieldPath: '_updatedAt',
    filterType: 'datetime',
    operatorType: 'dateEqual',
    titlePath: ['Updated at'],
  },
  {
    _key: generateKey(),
    documentTypes: [],
    fieldPath: '_createdAt',
    filterType: 'datetime',
    operatorType: 'dateEqual',
    titlePath: ['Created at'],
  },
  {
    _key: generateKey(),
    documentTypes: [],
    filterType: 'references',
    operatorType: 'referenceEqual',
    titlePath: [],
  },
]

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

  const filteredMenuItems = useCreateFilteredMenuItems(titleFilter)

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

function includesDocumentTypes(documentTypes: string[], searchFilter: SearchFilter) {
  return searchFilter.documentTypes.some((type) => documentTypes.includes(type))
}

function sharesDocumentTypes(documentTypes: string[], searchFilter: SearchFilter) {
  return difference(documentTypes, searchFilter.documentTypes || []).length === 0
}

function includesFilterTitle(searchFilter: SearchFilter, currentTitle: string) {
  const filter = getFilterDefinition(searchFilter.filterType)
  if (!filter) {
    return false
  }

  let title = ''
  if (filter?.fieldType) {
    title = searchFilter.titlePath.join('/')
  } else {
    title = filter?.title
  }
  return title.toLowerCase().includes(currentTitle.toLowerCase())
}

/**
 * Creates a flat list of filter menu items based on the current filter text input.
 */
function useCreateFilteredMenuItems(titleFilter: string): SearchFilterMenuItem[] {
  const {
    fieldRegistry,
    state: {
      documentTypesNarrowed,
      terms: {types},
    },
  } = useSearchState()

  return useMemo(() => {
    const filteredMenuItems: SearchFilterMenuItem[] = []

    // Common filters
    const commonFilters: SearchFilter[] = COMMON_FILTERS.filter((searchFilter) =>
      includesFilterTitle(searchFilter, titleFilter)
    )

    // Create search filters from field registry
    const allFilters: SearchFilter[] = fieldRegistry
      .map((object) => ({
        _key: object._key,
        documentTypes: object.documentTypes,
        fieldPath: object.fieldPath,
        filterType: object.type,
        path: object.titlePath,
        type: 'field',
        titlePath: object.titlePath,
      }))
      .filter((searchFilter) => includesFilterTitle(searchFilter, titleFilter))

    // Extract shared filters (when more than 1 document type is selected)
    let sharedFilters: SearchFilter[] = []
    // if (documentTypesNarrowed.length > 1 && (filters.length > 1 || types.length > 1)) {
    if (documentTypesNarrowed.length > 1 && types.length > 1) {
      sharedFilters = allFilters.filter((searchFilter) =>
        sharesDocumentTypes(documentTypesNarrowed, searchFilter)
      )
    }

    // Extract applicable fields
    let applicableFilters: SearchFilter[] = []
    if (documentTypesNarrowed.length > 0) {
      applicableFilters = allFilters.filter((searchFilter) =>
        includesDocumentTypes(documentTypesNarrowed, searchFilter)
      )
    }

    // Add common filters
    commonFilters.forEach((searchFilter) => {
      filteredMenuItems.push({filter: searchFilter, type: 'filter'})
    })

    // Add shared fields
    if (sharedFilters.length > 0) {
      const groupTitle = 'Shared fields'
      filteredMenuItems.push({title: groupTitle, type: 'header'})
      sharedFilters.forEach((searchFilter) => {
        filteredMenuItems.push({filter: searchFilter, group: groupTitle, type: 'filter'})
      })
    }

    // Add 'applicable' fields
    if (applicableFilters.length > 0) {
      const groupTitle = 'Applicable fields'
      filteredMenuItems.push({title: groupTitle, type: 'header'})
      applicableFilters.forEach((searchFilter) => {
        filteredMenuItems.push({filter: searchFilter, group: groupTitle, type: 'filter'})
      })
    }

    // Add all fields
    if (documentTypesNarrowed.length === 0) {
      const groupTitle = 'All fields'
      if (allFilters.length > 0) {
        filteredMenuItems.push({title: groupTitle, type: 'header'})
        allFilters.forEach((searchFilter) => {
          filteredMenuItems.push({filter: searchFilter, group: groupTitle, type: 'filter'})
        })
      }
    }

    return filteredMenuItems.map((menuItem) => mapDuplicatedTitles(filteredMenuItems, menuItem))
  }, [documentTypesNarrowed, fieldRegistry, titleFilter, types.length])
}

function mapDuplicatedTitles(allMenuItems: SearchFilterMenuItem[], menuItem: SearchFilterMenuItem) {
  const hasDuplicateTitle =
    menuItem.type === 'filter' &&
    allMenuItems.filter(
      (f) => f.type === 'filter' && isEqual(f.filter.titlePath, menuItem.filter.titlePath)
    ).length > 1

  return {
    ...menuItem,
    ...(hasDuplicateTitle && menuItem.type === 'filter' ? {showSubtitle: hasDuplicateTitle} : {}),
  }
}
