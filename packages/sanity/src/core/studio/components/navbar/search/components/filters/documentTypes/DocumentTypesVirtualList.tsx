import {Box, Label, MenuDivider} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {useEffect, useState} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {CommandListItem} from '../../commandList/CommandListItem'
import {CommandListItems} from '../../commandList/CommandListItems'
import {useCommandList} from '../../commandList/useCommandList'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

interface DocumentTypesVirtualListProps {
  filteredItems: DocumentTypeMenuItem[]
}

export function DocumentTypesVirtualList({filteredItems}: DocumentTypesVirtualListProps) {
  const {
    state: {
      terms: {types},
    },
  } = useSearchState()

  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {getTotalSize, getVirtualItems, measureElement, scrollToIndex} = useVirtualizer({
    count: filteredItems.length,
    estimateSize: () => 37,
    getItemKey: (index) => {
      const virtualItem = filteredItems[index]
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
    getScrollElement: () => virtualList,
    overscan: 20,
  })

  const {itemIndices, setVirtualListScrollToIndex} = useCommandList()

  // Scroll to top whenever types are cleared
  useEffect(() => {
    if (types.length === 0) {
      scrollToIndex(0)
    }
  }, [scrollToIndex, types.length])

  /**
   * Send react-virtual's `scrollToIndex` function to shared CommandList context
   */
  useEffect(() => {
    setVirtualListScrollToIndex(scrollToIndex)
  }, [setVirtualListScrollToIndex, scrollToIndex])

  return (
    <CommandListItems
      paddingBottom={1}
      setVirtualListRef={setVirtualListRef}
      totalHeight={getTotalSize()}
    >
      {getVirtualItems().map((virtualRow) => {
        const virtualItem = filteredItems[virtualRow.index]

        return (
          <CommandListItem
            activeIndex={virtualItem.type === 'item' ? itemIndices[virtualRow.index] ?? -1 : -1}
            data-index={virtualRow.index}
            key={virtualRow.key}
            measure={measureElement}
            virtualRow={virtualRow}
          >
            {virtualItem.type === 'divider' && (
              <Box padding={1}>
                <MenuDivider />
              </Box>
            )}
            {virtualItem.type === 'header' && (
              <Box margin={1} paddingBottom={2} paddingTop={3} paddingX={3}>
                <Label muted size={0}>
                  {virtualItem.title}
                </Label>
              </Box>
            )}
            {virtualItem.type === 'item' && (
              <DocumentTypeFilterItem
                key={virtualRow.key}
                paddingX={1}
                paddingTop={1}
                selected={virtualItem.selected}
                type={virtualItem.item}
              />
            )}
          </CommandListItem>
        )
      })}
    </CommandListItems>
  )
}
