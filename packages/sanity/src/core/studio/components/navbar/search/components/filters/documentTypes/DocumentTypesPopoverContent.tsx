import {SearchIcon} from '@sanity/icons'
import {Schema} from '@sanity/types'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {partition} from 'lodash'
import React, {useCallback, useId, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../../hooks'
import type {SearchableType} from '../../../../../../../search'
import {SUBHEADER_HEIGHT_SMALL} from '../../../constants'
import {CommandListProvider} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {getSelectableOmnisearchTypes} from '../../../utils/selectors'
import {supportsTouch} from '../../../utils/supportsTouch'
import {CustomTextInput} from '../../common/CustomTextInput'
import {DocumentTypesVirtualList} from './DocumentTypesVirtualList'

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const SearchHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
`

const SearchHeaderContentFlex = styled(Flex)`
  box-sizing: border-box;
  height: ${SUBHEADER_HEIGHT_SMALL};
`

export function DocumentTypesPopoverContent() {
  const [childContainerElement, setChildContainerRef] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputRef] = useState<HTMLInputElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayRef] = useState<HTMLDivElement | null>(null)
  const [typeFilter, setTypeFilter] = useState('')

  const schema = useSchema()

  const {
    dispatch,
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  // Get a snapshot of initial selected types
  const [selectedTypesSnapshot, setSelectedTypesSnapshot] = useState(selectedTypes)

  const filteredItems = useGetVirtualItems(schema, selectedTypes, selectedTypesSnapshot, typeFilter)

  const handleClearTypes = useCallback(() => {
    if (!supportsTouch) {
      headerInputElement?.focus()
    }
    setSelectedTypesSnapshot([])
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch, headerInputElement])

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const commandListId = useId()

  return (
    <CommandListProvider
      ariaChildrenLabel="Document types"
      ariaHeaderLabel="Filter by document type"
      ariaMultiselectable
      childContainerElement={childContainerElement}
      childCount={filteredItems.length}
      containerElement={containerElement}
      headerInputElement={headerInputElement}
      id={commandListId}
      pointerOverlayElement={pointerOverlayElement}
      virtualList
    >
      <Flex direction="column" ref={setContainerRef} style={{width: '250px'}}>
        {/* Search header */}
        <SearchHeaderBox>
          <SearchHeaderContentFlex align="center" flex={1} padding={1}>
            <CustomTextInput
              autoComplete="off"
              border={false}
              clearButton={!!typeFilter}
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
              value={typeFilter}
            />
          </SearchHeaderContentFlex>
        </SearchHeaderBox>

        <Box flex={1}>
          {filteredItems.length > 0 && (
            <DocumentTypesVirtualList
              filteredItems={filteredItems}
              setChildContainerRef={setChildContainerRef}
              setPointerOverlayRef={setPointerOverlayRef}
            />
          )}

          {/* No results */}
          {!filteredItems.length && (
            <Box padding={3}>
              <Text muted size={1} textOverflow="ellipsis">
                No matches for '{typeFilter}'
              </Text>
            </Box>
          )}
        </Box>

        {/* Clear button */}
        {!typeFilter && selectedTypes.length > 0 && (
          <ClearButtonBox padding={1}>
            <Stack>
              <Button
                aria-label="Clear checked filters"
                data-name="type-filter-button"
                disabled={selectedTypes.length === 0}
                fontSize={1}
                mode="bleed"
                onClick={handleClearTypes}
                padding={3}
                text="Clear"
                tone="primary"
              />
            </Stack>
          </ClearButtonBox>
        )}
      </Flex>
    </CommandListProvider>
  )
}

function useGetVirtualItems(
  schema: Schema,
  selectedTypes: SearchableType[],
  selectedTypesSnapshot: SearchableType[],
  typeFilter: string
) {
  return useMemo(() => {
    const [itemsSelected, itemsUnselected] = partition(
      getSelectableOmnisearchTypes(schema, typeFilter),
      (type) => selectedTypesSnapshot.includes(type)
    )

    const hasSelectedItems = itemsSelected.length > 0
    const hasUnselectedItems = itemsSelected.length > 0

    const items: DocumentTypeMenuItem[] = []
    if (hasSelectedItems) {
      items.push({title: 'Selected', type: 'header'})
    }
    itemsSelected.forEach((item) =>
      items.push({item, selected: selectedTypes.includes(item), type: 'item'})
    )
    if (hasSelectedItems && hasUnselectedItems) {
      items.push({type: 'divider'})
    }
    itemsUnselected.forEach((item) =>
      items.push({item, selected: selectedTypes.includes(item), type: 'item'})
    )
    return items
  }, [schema, selectedTypes, selectedTypesSnapshot, typeFilter])
}
