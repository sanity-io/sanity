import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useEffect, useState} from 'react'
import type {FilterMenuItem} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {CommandListItems} from '../../commandList/CommandListItems'
import {useCommandList} from '../../commandList/useCommandList'
import {MenuItemFilter} from './items/MenuItemFilter'
import {MenuItemHeader} from './items/MenuItemHeader'

interface AddFilterVirtualListProps {
  menuItems: FilterMenuItem[]
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
}

export function AddFilterVirtualList({
  menuItems,
  onClose,
  setChildContainerRef,
}: AddFilterVirtualListProps) {
  const [virtualList, setVirtualListRef] = useState<HTMLDivElement | null>(null)

  const {itemIndices, setVirtualListScrollToIndex} = useCommandList()

  const {getTotalSize, getVirtualItems, measureElement, scrollToIndex} = useVirtualizer({
    count: menuItems.length,
    enableSmoothScroll: false,
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
      setChildContainerRef={setChildContainerRef}
      setVirtualListRef={setVirtualListRef}
      totalHeight={getTotalSize()}
    >
      {getVirtualItems().map((virtualRow) => {
        const menuItem = menuItems[virtualRow.index]
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
            {menuItem.type === 'filter' && (
              <MenuItemFilter
                index={itemIndices[virtualRow.index]}
                item={menuItem}
                onClose={onClose}
                paddingTop={1}
                paddingX={1}
              />
            )}
            {menuItem.type === 'header' && <MenuItemHeader item={menuItem} />}
          </div>
        )
      })}
    </CommandListItems>
  )
}
