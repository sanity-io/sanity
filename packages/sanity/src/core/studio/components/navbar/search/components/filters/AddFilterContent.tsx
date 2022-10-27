import {SearchIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../hooks'
import {FILTERS} from '../../config/filters'
import {SUBHEADER_HEIGHT_SMALL} from '../../constants'
import {CommandListProvider} from '../../contexts/commandList'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useSelectedDocumentTypes} from '../../hooks/useSelectedDocumentTypes'
import {SearchFilterMenuItem} from '../../types'
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

  const schema = useSchema()
  const {filterGroups} = useSearchState()
  const currentDocumentTypes = useSelectedDocumentTypes()

  const filteredMenuItems = useMemo(() => {
    return filterGroups
      .reduce<SearchFilterMenuItem[]>((acc, val) => {
        // Header
        if (val.type === 'fields') {
          let headerTitle = 'All fields'
          if (currentDocumentTypes.length > 0) {
            const firstDocumentType = schema.get(currentDocumentTypes[0])
            const firstDocumentTitle = firstDocumentType?.title || firstDocumentType?.name || ''
            headerTitle = `Fields in ${firstDocumentTitle}`
            if (currentDocumentTypes.length > 1) {
              headerTitle += ` +${currentDocumentTypes.length - 1}`
            }
          }

          acc.push({
            title: headerTitle,
            type: 'header',
          })
        }
        // Filters
        val.items.forEach((filter) => {
          acc.push({filter, type: 'filter'})
        })
        return acc
      }, [])
      .filter((filter) => includesDocumentTypes(filter, currentDocumentTypes))
      .filter((filter) => includesFilterTitle(filter, titleFilter))
  }, [currentDocumentTypes, filterGroups, schema, titleFilter])

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

function includesDocumentTypes(menuItem: SearchFilterMenuItem, documentTypes: string[]) {
  if (menuItem.type === 'filter') {
    if (!menuItem.filter.documentTypes || menuItem.filter.documentTypes.length === 0) {
      return true
    }

    return documentTypes.every((type) => menuItem.filter.documentTypes?.includes(type))
  }

  return true
}

function includesFilterTitle(menuItem: SearchFilterMenuItem, currentTitle: string) {
  let title = ''
  if (menuItem.type === 'filter') {
    if (menuItem.filter.type === 'compound') {
      title = FILTERS.compound[menuItem.filter.id].title
    }
    if (menuItem.filter.type === 'custom') {
      title = menuItem.filter.title
    }
    if (menuItem.filter.type === 'field') {
      title = menuItem.filter.path.join(' / ')
    }
    return title.toLowerCase().includes(currentTitle.toLowerCase())
  }

  return true
}
