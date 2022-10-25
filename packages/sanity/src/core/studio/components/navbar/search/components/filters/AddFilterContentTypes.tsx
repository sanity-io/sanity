import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {Dispatch, SetStateAction, useEffect, useRef} from 'react'
import styled from 'styled-components'
import type {KeyedSearchFilter} from '../../types'
// import {PointerOverlay} from '../PointerOverlay'
import {FilterMenuItem} from './FilterMenuItem'

interface AddFilterContentTypesProps {
  filteredFilters: KeyedSearchFilter[]
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
const MenuItemByIndex = React.memo(function MenuItemByIndex({
  filter,
  onClose,
}: {
  filter: KeyedSearchFilter
  onClose: () => void
}) {
  return <FilterMenuItem filter={filter} onClose={onClose} />
})

export function AddFilterContentTypes({
  filteredFilters,
  onClose,
  setChildContainerRef,
  setPointerOverlayRef,
}: AddFilterContentTypesProps) {
  const childParentRef = useRef<HTMLDivElement | null>(null)

  const {getTotalSize, getVirtualItems, scrollToIndex} = useVirtualizer({
    count: filteredFilters.length,
    enableSmoothScroll: false,
    estimateSize: () => 40,
    getScrollElement: () => childParentRef.current,
    overscan: 20,
  })

  // Scroll to top whenever filters change
  useEffect(() => {
    scrollToIndex(0)
  }, [filteredFilters.length, scrollToIndex])

  return (
    <VirtualListBox data-overflow ref={childParentRef} tabIndex={-1}>
      {/* <PointerOverlay ref={setPointerOverlayRef} /> */}
      <VirtualListChildBox $height={getTotalSize()} flex={1} ref={setChildContainerRef}>
        {getVirtualItems().map((virtualRow) => {
          const filter = filteredFilters[virtualRow.index]
          return (
            <div
              key={filter._key}
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
              <MenuItemByIndex filter={filter} onClose={onClose} />
            </div>
          )
        })}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
