import {useVirtualizer} from '@tanstack/react-virtual'
import React, {useEffect, useState} from 'react'
import type {FilterMenuItem} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {CommandListItem} from '../../commandList/CommandListItem'
import {CommandListItems} from '../../commandList/CommandListItems'
import {useCommandList} from '../../commandList/useCommandList'
import {MenuItemFilter} from './items/MenuItemFilter'
import {MenuItemHeader} from './items/MenuItemHeader'

interface AddFilterVirtualListProps {
  menuItems: FilterMenuItem[]
  onClose: () => void
}

export function AddFilterVirtualList({menuItems, onClose}: AddFilterVirtualListProps) {
  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {itemIndices, setVirtualListScrollToIndex} = useCommandList()

  const {getTotalSize, getVirtualItems, measureElement, scrollToIndex} = useVirtualizer({
    count: menuItems.length,
    estimateSize: () => 45,
    getItemKey: (index) => {
      const menuItem = menuItems[index]
      switch (menuItem.type) {
        case 'filter':
          return [
            ...(menuItem.group ? [menuItem.group] : []), //
            getFilterKey(menuItem.filter),
          ].join('-')
        case 'header':
          return `${menuItem.type}-${menuItem.title}`
        default:
          return index
      }
    },
    getScrollElement: () => virtualList,
    overscan: 20,
  })

  // Scroll to top whenever filters change
  useEffect(() => {
    scrollToIndex(0)
  }, [menuItems.length, scrollToIndex])

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
        const menuItem = menuItems[virtualRow.index]
        return (
          <CommandListItem
            activeIndex={menuItem.type === 'filter' ? itemIndices[virtualRow.index] ?? -1 : -1}
            data-index={virtualRow.index}
            key={virtualRow.key}
            measure={measureElement}
            virtualRow={virtualRow}
          >
            {menuItem.type === 'filter' && (
              <MenuItemFilter item={menuItem} onClose={onClose} paddingTop={1} paddingX={1} />
            )}
            {menuItem.type === 'header' && <MenuItemHeader item={menuItem} />}
          </CommandListItem>
        )
      })}
    </CommandListItems>
  )
}
