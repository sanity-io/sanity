import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useEffect, useRef} from 'react'
import styled from 'styled-components'
import {useCommandList} from '../../../contexts/commandList'
import type {FilterMenuItem} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {PointerOverlay} from '../common/PointerOverlay'
import {MenuItemFilter} from './items/MenuItemFilter'
import {MenuItemHeader} from './items/MenuItemHeader'

interface AddFilterVirtualListProps {
  menuItems: FilterMenuItem[]
  onClose: () => void
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
}

const VirtualListBox = styled(Box)`
  height: 100%;
  outline: none;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
`

const VirtualListChildBox = styled(Box)<{$height: number}>`
  height: ${({$height}) => `${$height}px`};
  position: relative;
  width: 100%;
`

export function AddFilterVirtualList({
  menuItems,
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: AddFilterVirtualListProps) {
  const childParentRef = useRef<HTMLDivElement | null>(null)

  const {setVirtualListScrollToIndex} = useCommandList()

  const {getTotalSize, getVirtualItems, measureElement, scrollToIndex} = useVirtualizer({
    count: menuItems.length,
    enableSmoothScroll: false,
    estimateSize: () => 40,
    getScrollElement: () => childParentRef.current,
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
    <VirtualListBox data-overflow ref={childParentRef} tabIndex={-1}>
      <PointerOverlay ref={setPointerOverlayRef} />
      <VirtualListChildBox $height={getTotalSize()} flex={1} ref={setChildContainerRef}>
        {getVirtualItems().map((virtualRow) => {
          const menuItem = menuItems[virtualRow.index]
          // TODO: simplify
          let key = ''
          if (menuItem.type === 'header') {
            key = menuItem.title
          }
          if (menuItem.type === 'filter') {
            key = [
              ...(menuItem.group ? [menuItem.group] : []), //
              getFilterKey(menuItem.filter),
            ].join('-')
          }

          return (
            <div
              data-index={virtualRow.index}
              key={`${key}-${virtualRow.key}`}
              ref={measureElement}
              style={{
                flex: 1,
                // Kept inline to prevent styled-components from generating loads of classes on virtual list scroll
                transform: `translateY(${virtualRow.start}px)`,
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              {menuItem.type === 'filter' && (
                <MenuItemFilter index={virtualRow.index} item={menuItem} onClose={onClose} />
              )}

              {menuItem.type === 'header' && (
                <MenuItemHeader isFirst={virtualRow.index === 0} item={menuItem} />
              )}
            </div>
          )
        })}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
