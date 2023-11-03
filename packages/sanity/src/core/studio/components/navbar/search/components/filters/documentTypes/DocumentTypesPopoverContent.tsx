import {Schema} from '@sanity/types'
import {Box, Flex, Label, MenuDivider, Stack, Text} from '@sanity/ui'
import {partition} from 'lodash'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {
  CommandList,
  CommandListGetItemSelectedCallback,
  CommandListHandle,
  CommandListRenderItemCallback,
} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import type {SearchableType} from '../../../../../../../search'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {getSelectableOmnisearchTypes} from '../../../utils/selectors'
import {Button} from '../../../../../../../../ui'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

const ClearButtonBox = styled(Box)`
  border-top: 1px solid ${({theme}) => theme.sanity.color.base.border};
  flex-shrink: 0;
`

export function DocumentTypesPopoverContent() {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
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

  const documentTypeItems = useGetDocumentTypeItems(
    schema,
    selectedTypes,
    selectedTypesSnapshot,
    typeFilter,
  )

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTypeFilter(e.currentTarget.value),
    [setTypeFilter],
  )
  const handleFilterClear = useCallback(() => setTypeFilter(''), [])

  const handleTypesClear = useCallback(() => {
    setSelectedTypesSnapshot([])
    dispatch({type: 'TERMS_TYPES_CLEAR'})

    // Re-focus the command list input element
    commandListRef?.current?.focusInputElement()
    commandListRef?.current?.scrollToIndex(0)
  }, [dispatch])

  const getItemKey = useCallback(
    (index: number) => {
      const virtualItem = documentTypeItems[index]
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
    [documentTypeItems],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<DocumentTypeMenuItem>>((item) => {
    if (item.type === 'divider') {
      return (
        <Box paddingY={1}>
          <MenuDivider />
        </Box>
      )
    }
    if (item.type === 'header') {
      return (
        <Box margin={1} paddingBottom={2} paddingTop={3}>
          <Label muted size={0}>
            {item.title}
          </Label>
        </Box>
      )
    }
    if (item.type === 'item') {
      return <DocumentTypeFilterItem paddingBottom={1} selected={item.selected} type={item.item} />
    }
    return null
  }, [])

  const getItemDisabled = useCallback<CommandListGetItemSelectedCallback>(
    (index) => {
      const item = documentTypeItems[index]
      return item.type !== 'item'
    },
    [documentTypeItems],
  )

  const getItemSelected = useCallback<CommandListGetItemSelectedCallback>(
    (index) => {
      const item = documentTypeItems[index]
      return item.type === 'item' && item.selected
    },
    [documentTypeItems],
  )

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
        {documentTypeItems.length > 0 && (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel="Document types"
            ariaMultiselectable
            autoFocus="input"
            getItemDisabled={getItemDisabled}
            getItemSelected={getItemSelected}
            getItemKey={getItemKey}
            inputElement={inputElement}
            itemHeight={37}
            items={documentTypeItems}
            overscan={20}
            padding={1}
            paddingBottom={0}
            ref={commandListRef}
            renderItem={renderItem}
          />
        )}

        {/* No results */}
        {!documentTypeItems.length && (
          <Box padding={3}>
            <Text muted size={1} textOverflow="ellipsis">
              No matches for &apos;{typeFilter}&apos;
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
          mode="bleed"
          onClick={onClick}
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
  typeFilter: string,
) {
  return useMemo(() => {
    const [itemsSelected, itemsUnselected] = partition(
      getSelectableOmnisearchTypes(schema, typeFilter),
      (type) => selectedTypesSnapshot.includes(type),
    )

    const hasSelectedItems = itemsSelected.length > 0
    const hasUnselectedItems = itemsSelected.length > 0

    const items: DocumentTypeMenuItem[] = []
    if (hasSelectedItems) {
      items.push({title: 'Selected', type: 'header'})
    }
    itemsSelected.forEach((item) =>
      items.push({item, selected: selectedTypes.includes(item), type: 'item'}),
    )
    if (hasSelectedItems && hasUnselectedItems) {
      items.push({type: 'divider'})
    }
    itemsUnselected.forEach((item) =>
      items.push({item, selected: selectedTypes.includes(item), type: 'item'}),
    )

    return items
  }, [schema, selectedTypes, selectedTypesSnapshot, typeFilter])
}
