import {SearchIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {FILTERS} from '../../config/filters'
import {SUBHEADER_HEIGHT_SMALL} from '../../constants'
import {CommandListProvider} from '../../contexts/commandList'
import {useSearchState} from '../../contexts/search/useSearchState'
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

  const filteredFilters = useMemo(() => {
    return availableFilters.filter((filter) => {
      if (filter.type === 'compound') {
        return FILTERS.compound[filter.id]?.title
      }
      if (filter.type === 'custom') {
        return filter.title.toLowerCase().includes(titleFilter?.toLowerCase())
      }
      if (filter.type === 'field') {
        return filter.path.join(' / ').toLowerCase().includes(titleFilter?.toLowerCase())
      }
      return false
    })
    // .sort((a, b) => a.path.join(',').localeCompare(b.path.join(',')))
  }, [availableFilters, titleFilter])

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
