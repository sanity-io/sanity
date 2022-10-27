import {SearchIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {FILTERS} from '../../config/filters'
import {SUBHEADER_HEIGHT_SMALL} from '../../constants'
import {CommandListProvider} from '../../contexts/commandList'
import {useSearchState} from '../../contexts/search/useSearchState'
import {useSelectedDocumentTypes} from '../../hooks/useSelectedDocumentTypes'
import {KeyedSearchFilter} from '../../types'
import {CustomTextInput} from '../CustomTextInput'
import {AddFilterContentTypes} from './AddFilterContentTypes'
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

  const {availableFilters} = useSearchState()

  const currentDocumentTypes = useSelectedDocumentTypes()

  const filteredFilters = useMemo(() => {
    return availableFilters
      .filter((filter) => includesDocumentTypes(filter, currentDocumentTypes))
      .filter((filter) => includesFilterTitle(filter, titleFilter))
  }, [availableFilters, currentDocumentTypes, titleFilter])

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTitleFilter(e.currentTarget.value),
    [setTitleFilter]
  )
  const handleFilterClear = useCallback(() => setTitleFilter(''), [])

  const filterListId = useId()

  return (
    <FilterPopoverWrapper onClose={onClose}>
      <Flex
        // padding={3}
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
          childCount={filteredFilters.length}
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
              <AddFilterContentTypes
                filteredFilters={filteredFilters}
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

function includesDocumentTypes(filter: KeyedSearchFilter, documentTypes: string[]) {
  if (!filter.documentTypes || filter.documentTypes.length === 0) {
    return true
  }
  return documentTypes.every((type) => filter.documentTypes?.includes(type))
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
