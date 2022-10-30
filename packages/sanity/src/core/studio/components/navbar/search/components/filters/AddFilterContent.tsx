import {SearchIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import {difference, isEqual} from 'lodash'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {FILTERS} from '../../config/filters'
import {SUBHEADER_HEIGHT_SMALL} from '../../constants'
import {CommandListProvider} from '../../contexts/commandList'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useSelectedDocumentTypes} from '../../hooks/useSelectedDocumentTypes'
import {KeyedSearchFilter, SearchFilterMenuItem} from '../../types'
import {CustomTextInput} from '../CustomTextInput'
import {AddFilterContentMenuItems} from './AddFilterContentMenuItems'
import {FilterPopoverWrapper} from './FilterPopoverWrapper'

interface AddFilterContentProps {
  onClose: () => void
}

const FilterHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const FilterHeaderContentFlex = styled(Flex)`
  box-sizing: border-box;
  height: ${SUBHEADER_HEIGHT_SMALL};
`

export function AddFilterContent({onClose}: AddFilterContentProps) {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)
  const [titleFilter, setTitleFilter] = useState('')

  const {
    filterGroups,
    state: {
      terms: {filters, types},
    },
  } = useSearchState()
  const currentDocumentTypes = useSelectedDocumentTypes()

  // TODO: refactor
  const filteredMenuItems = useMemo(() => {
    return filterGroups.reduce<SearchFilterMenuItem[]>((acc, val) => {
      if (val.type === 'fields') {
        // TODO: only show shared fields if filter count > 1 ||
        // Get shared fields
        if (currentDocumentTypes.length > 1 && (filters.length > 1 || types.length > 1)) {
          const sharedItems = val.items
            .filter(
              (filter) => difference(currentDocumentTypes, filter?.documentTypes || []).length === 0
            )
            .filter((filter) => includesFilterTitle(filter, titleFilter))
            .map(toggleSubtitleVisibility)

          if (sharedItems.length > 0) {
            // Header
            acc.push({
              groupType: val.type,
              title: 'Shared fields in selection',
              type: 'header',
            })
            // Items
            sharedItems.forEach((filter) => {
              acc.push({filter, groupType: val.type, type: 'filter'})
            })
          }
        }

        if (currentDocumentTypes.length > 0) {
          // Applicable fields
          const applicableItems = val.items
            .filter((filter) =>
              // eslint-disable-next-line max-nested-callbacks
              filter.documentTypes?.some((type) => currentDocumentTypes.includes(type))
            )
            .filter((filter) => includesFilterTitle(filter, titleFilter))
            .map(toggleSubtitleVisibility)

          if (applicableItems.length > 0) {
            // Header
            acc.push({title: 'All fields in selection', type: 'header'})
            // Items
            applicableItems.forEach((filter) => {
              acc.push({filter, type: 'filter'})
            })
          }
        }

        if (currentDocumentTypes.length === 0) {
          const allItems = val.items
            .filter((filter) => includesFilterTitle(filter, titleFilter))
            .map(toggleSubtitleVisibility)

          if (allItems.length > 0) {
            // Header
            acc.push({title: 'All fields', type: 'header'})
            // Filters
            allItems.forEach((filter) => {
              acc.push({filter, type: 'filter'})
            })
          }
        }
      } else {
        // Filters
        val.items.forEach((filter) => {
          acc.push({filter, type: 'filter'})
        })
      }
      return acc
    }, [])
  }, [
    currentDocumentTypes,
    filterGroups,
    // schema,
    titleFilter,
  ])

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTitleFilter(e.currentTarget.value),
    [setTitleFilter]
  )
  const handleFilterClear = useCallback(() => setTitleFilter(''), [])

  const filterListId = useId()

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
              <AddFilterContentMenuItems
                menuItems={filteredMenuItems}
                onClose={onClose}
                setChildContainerRef={setChildContainerRef}
                setPointerOverlayRef={setPointerOverlayRef}
              />
            </Box>
          </Flex>
        </CommandListProvider>
      </Flex>
    </FilterPopoverWrapper>
  )
}

function includesFilterTitle(filter: KeyedSearchFilter, currentTitle: string) {
  let title = ''
  if (filter.type === 'compound') {
    title = FILTERS.compound[filter.id].title
  }
  if (filter.type === 'custom') {
    title = filter.title
  }
  if (filter.type === 'field') {
    title = filter.path.join(' / ')
  }
  return title.toLowerCase().includes(currentTitle.toLowerCase())
}

function toggleSubtitleVisibility(
  filter: KeyedSearchFilter,
  index: number,
  arr: KeyedSearchFilter[]
) {
  return {
    ...filter,
    // TODO: refactor
    showSubtitle:
      arr.filter((f) => {
        return (
          filter.type === 'field' &&
          f.type === 'field' &&
          isEqual(f.path, filter.path) &&
          f.type === filter.type
        )
      }).length > 1,
  }
}
