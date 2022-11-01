import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useEffect, useRef} from 'react'
import styled from 'styled-components'
import type {SearchFilterMenuItem} from '../../types'
// import {PointerOverlay} from '../PointerOverlay'
import {MenuItemFilter} from './menuItem/MenuItemFilter'
import {MenuItemHeader} from './menuItem/MenuItemHeader'

interface AddFilterContentTypesProps {
  menuItems: SearchFilterMenuItem[]
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

export function AddFilterContentMenuItems({
  menuItems,
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: AddFilterContentTypesProps) {
  const childParentRef = useRef<HTMLDivElement | null>(null)

  const {getTotalSize, getVirtualItems, scrollToIndex} = useVirtualizer({
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

  return (
    <VirtualListBox data-overflow ref={childParentRef} tabIndex={-1}>
      {/* <PointerOverlay ref={setPointerOverlayRef} /> */}
      <VirtualListChildBox $height={getTotalSize()} flex={1} ref={setChildContainerRef}>
        {getVirtualItems().map((virtualRow) => {
          const menuItem = menuItems[virtualRow.index]
          const key: string[] = [menuItem.groupType]
          if (menuItem.type === 'header') {
            key.push(menuItem.title)
          }
          if (menuItem.type === 'filter') {
            key.push(menuItem.filter._key)
          }

          return (
            <div
              key={key.join('-')}
              ref={virtualRow.measureElement}
              // onClick={handleResultClick}
              // onMouseDown={onChildMouseDown}
              // onMouseEnter={onChildMouseEnter(virtualRow.index)}
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
                <MenuItemFilter filter={menuItem.filter} onClose={onClose} />
              )}

              {menuItem.type === 'header' && (
                <MenuItemHeader isFirst={virtualRow.index === 0} title={menuItem.title} />
              )}
            </div>
          )
        })}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
