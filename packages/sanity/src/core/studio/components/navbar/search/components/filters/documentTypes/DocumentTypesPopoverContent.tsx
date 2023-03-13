import {Schema} from '@sanity/types'
import {Box, Button, Flex, Label, MenuDivider, Stack, Text} from '@sanity/ui'
import {partition} from 'lodash'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {
  CommandList,
  CommandListHandle,
  CommandListVirtualItemProps,
} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import type {SearchableType} from '../../../../../../../search'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {getSelectableOmnisearchTypes} from '../../../utils/selectors'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
  flex-shrink: 0;
`

export function DocumentTypesPopoverContent() {
  const [inputElement, setInputElement] = useState<HTMLElement | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const commandListRef = useRef<CommandListHandle | null>(null)

  const schema = useSchema()

  const {
    dispatch,
    state: {
      terms: {types: selectedTypes},
    },
  } = useSearchState()

  // Get a snapshot of initial selected types
  const [selectedTypesSnapshot, setSelectedTypesSnapshot] = useState(selectedTypes)

  const values = useGetDocumentTypeItems(schema, selectedTypes, selectedTypesSnapshot, typeFilter)

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter]
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const handleTypesClear = useCallback(() => {
    setSelectedTypesSnapshot([])
    dispatch({type: 'TERMS_TYPES_CLEAR'})

    // Re-focus the command list element (input if available, otherwise virtual list container)
    commandListRef?.current?.focusElement()
    commandListRef?.current?.scrollToIndex(0)
  }, [dispatch])

  const getItemKey = useCallback(
    (index: number) => {
      const virtualItem = values[index].value
      switch (virtualItem.type) {
        case 'divider':
          return `${virtualItem.type}-${index}`
        case 'header':
          return `${virtualItem.type}-${virtualItem.title}`
        case 'item':
          return `${virtualItem.type}-${virtualItem.item.name}`
        default:
          return index
      }
    },
    [values]
  )

  const renderItem = useCallback(({value}: CommandListVirtualItemProps<DocumentTypeMenuItem>) => {
    if (value.type === 'divider') {
      return (
        <Box padding={1}>
          <MenuDivider />
        </Box>
      )
    }
    if (value.type === 'header') {
      return (
        <Box margin={1} paddingBottom={2} paddingTop={3} paddingX={3}>
          <Label muted size={0}>
            {value.title}
          </Label>
        </Box>
      )
    }
    if (value.type === 'item') {
      return (
        <DocumentTypeFilterItem
          paddingX={1}
          paddingTop={1}
          selected={value.selected}
          type={value.item}
        />
      )
    }
    return null
  }, [])

  return (
    <Flex direction="column" style={{width: '250px'}}>
      {/* Search header */}
      <FilterPopoverContentHeader
        ariaInputLabel="Filter by document type"
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        ref={setInputElement}
        typeFilter={typeFilter}
      />

      <Flex>
        {values.length > 0 && (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Document types"
            ariaMultiselectable
            autoFocus
            fixedHeight
            getItemKey={getItemKey}
            inputElement={inputElement}
            itemHeight={37}
            overscan={20}
            paddingBottom={1}
            ref={commandListRef}
            renderItem={renderItem}
            values={values}
          />
        )}

        {/* No results */}
        {!values.length && (
          <Box padding={3}>
            <Text muted size={1} textOverflow="ellipsis">
              No matches for '{typeFilter}'
            </Text>
          </Box>
        )}
      </Flex>

      {/* Clear button */}
      {!typeFilter && selectedTypes.length > 0 && (
        <ClearButton onClick={handleTypesClear} selectedTypes={selectedTypes} />
      )}
    </Flex>
  )
}

function ClearButton({
  onClick,
  selectedTypes,
}: {
  onClick: () => void
  selectedTypes: SearchableType[]
}) {
  return (
    <ClearButtonBox padding={1}>
      <Stack>
        <Button
          aria-label="Clear checked filters"
          data-name="type-filter-button"
          disabled={selectedTypes.length === 0}
          fontSize={1}
          mode="bleed"
          onClick={onClick}
          padding={3}
          text="Clear"
          tone="primary"
        />
      </Stack>
    </ClearButtonBox>
  )
}

function useGetDocumentTypeItems(
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

    return items.map((i) => ({
      disabled: i.type !== 'item',
      selected: i.type === 'item' && i.selected,
      value: i,
    }))
  }, [schema, selectedTypes, selectedTypesSnapshot, typeFilter])
}
