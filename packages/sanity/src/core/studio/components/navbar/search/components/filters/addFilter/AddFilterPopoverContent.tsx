import {SearchIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../../hooks'
import {CommandListProvider} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {CustomTextInput} from '../../common/CustomTextInput'
import {AddFilterVirtualList} from './AddFilterVirtualList'
import {createFilterMenuItems} from './createFilterMenuItems'

interface AddFilterPopoverContentProps {
  onClose: () => void
}

const FilterHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const FilterHeaderContentFlex = styled(Flex)`
  box-sizing: border-box;
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
    state: {
      documentTypesNarrowed,
      definitions,
      terms: {types},
    },
  } = useSearchState()

  const filteredMenuItems = useMemo(
    () =>
      createFilterMenuItems({
        documentTypesNarrowed,
        fieldDefinitions: definitions.fields,
        filterDefinitions: definitions.filters,
        schema,
        titleFilter,
        types,
      }),
    [documentTypesNarrowed, definitions.fields, definitions.filters, schema, titleFilter, types]
  )

  return (
    <CommandListProvider
      ariaChildrenLabel="Filters"
      ariaHeaderLabel="Filter by title"
      childCount={filteredMenuItems.length}
      childContainerElement={childContainerElement}
      containerElement={containerElement}
      headerInputElement={headerInputElement}
      id={filterListId}
      pointerOverlayElement={pointerOverlayElement}
      virtualList
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
            <AddFilterVirtualList
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
  )
}
