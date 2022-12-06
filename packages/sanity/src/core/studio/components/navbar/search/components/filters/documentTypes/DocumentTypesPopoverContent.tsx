import {Schema} from '@sanity/types'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {partition} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useSchema} from '../../../../../../../hooks'
import type {SearchableType} from '../../../../../../../search'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {getSelectableOmnisearchTypes} from '../../../utils/selectors'
import {CommandListContainer} from '../../commandList/CommandListContainer'
import {CommandListProvider} from '../../commandList/CommandListProvider'
import {useCommandList} from '../../commandList/useCommandList'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {DocumentTypesVirtualList} from './DocumentTypesVirtualList'

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
  flex-shrink: 0;
`

export function DocumentTypesPopoverContent() {
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

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const handleTypesClear = useCallback(() => {
    setSelectedTypesSnapshot([])
    dispatch({type: 'TERMS_TYPES_CLEAR'})
  }, [dispatch])

  /**
   * Create a map of indices for our virtual list, ignoring non-filter items.
   * This is to ensure navigating via keyboard skips over these non-interactive items.
   */
  const itemIndices = useMemo(() => {
    let i = -1
    return filteredItems.reduce<(number | null)[]>((acc, val, index) => {
      const isInteractive = val.type === 'item'
      if (isInteractive) {
        i += 1
      }
      acc[index] = isInteractive ? i : null
      return acc
    }, [])
  }, [filteredItems])

  const itemIndicesSelected = useMemo(() => {
    return filteredItems.map((f) => f.type === 'item' && f.selected)
  }, [filteredItems])

  return (
    <CommandListProvider
      ariaActiveDescendant={filteredItems.length > 0}
      ariaChildrenLabel="Document types"
      ariaHeaderLabel="Filter by document type"
      ariaMultiselectable
      autoFocus
      itemIndices={itemIndices}
      itemIndicesSelected={itemIndicesSelected}
    >
      <Flex direction="column" style={{width: '250px'}}>
        {/* Search header */}
        <FilterPopoverContentHeader
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          typeFilter={typeFilter}
        />

        <CommandListContainer>
          {filteredItems.length > 0 && <DocumentTypesVirtualList filteredItems={filteredItems} />}

          {/* No results */}
          {!filteredItems.length && (
            <Box padding={3}>
              <Text muted size={1} textOverflow="ellipsis">
                No matches for '{typeFilter}'
              </Text>
            </Box>
          )}
        </CommandListContainer>

        {/* Clear button */}
        {!typeFilter && selectedTypes.length > 0 && (
          <ClearButton onClick={handleTypesClear} selectedTypes={selectedTypes} />
        )}
      </Flex>
    </CommandListProvider>
  )
}

function ClearButton({
  onClick,
  selectedTypes,
}: {
  onClick: () => void
  selectedTypes: SearchableType[]
}) {
  const {focusHeaderInputElement} = useCommandList()

  const handleClear = useCallback(() => {
    focusHeaderInputElement()
    onClick?.()
  }, [focusHeaderInputElement, onClick])

  return (
    <ClearButtonBox padding={1}>
      <Stack>
        <Button
          aria-label="Clear checked filters"
          data-name="type-filter-button"
          disabled={selectedTypes.length === 0}
          fontSize={1}
          mode="bleed"
          onClick={handleClear}
          padding={3}
          text="Clear"
          tone="primary"
        />
      </Stack>
    </ClearButtonBox>
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
