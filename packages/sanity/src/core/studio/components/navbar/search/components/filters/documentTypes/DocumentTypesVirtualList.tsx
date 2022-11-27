import {Box, Label, MenuDivider} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useEffect, useState} from 'react'
import {useCommandList} from '../../../contexts/commandList'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {DocumentTypeMenuItem} from '../../../types'
import {CommandListItems} from '../../common/CommandListItems'
import {DocumentTypeFilterItem} from './items/DocumentTypeFilterItem'

interface DocumentTypesVirtualListProps {
  filteredItems: DocumentTypeMenuItem[]
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
}

export function DocumentTypesVirtualList({
  filteredItems,
  setChildContainerRef,
  setPointerOverlayRef,
}: DocumentTypesVirtualListProps) {
  const {
    state: {
      terms: {types},
    },
  } = useSearchState()

  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {getTotalSize, getVirtualItems, measureElement, scrollToIndex} = useVirtualizer({
    count: filteredItems.length,
    enableSmoothScroll: false,
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
      setChildContainerRef={setChildContainerRef}
      setPointerOverlayRef={setPointerOverlayRef}
      setVirtualListRef={setVirtualListRef}
      totalHeight={getTotalSize()}
    >
      {getVirtualItems().map((virtualRow) => {
        const virtualItem = filteredItems[virtualRow.index]

        return (
          <div
            data-index={virtualRow.index}
            key={virtualRow.key}
            ref={measureElement}
            // Kept inline to prevent styled-components from generating loads of classes on virtual list scroll
            style={{
              flex: 1,
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
            }}
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
                index={itemIndices[virtualRow.index]}
                key={virtualRow.key}
                selected={virtualItem.selected}
                type={virtualItem.item}
              />
            )}
          </div>
        )
      })}
    </CommandListItems>
  )
}
