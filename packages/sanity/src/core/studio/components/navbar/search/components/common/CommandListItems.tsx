import {Box} from '@sanity/ui'
import React, {Dispatch, ReactNode, SetStateAction} from 'react'
import styled from 'styled-components'
import {PointerOverlay} from '../filters/common/PointerOverlay'

interface CommandListItemsProps {
  children: ReactNode
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setVirtualListRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  // setVirtualScrollElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  totalHeight: number
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

export function CommandListItems({
  children,
  setChildContainerRef,
  setPointerOverlayRef,
  setVirtualListRef,
  totalHeight,
}: CommandListItemsProps) {
  return (
    <VirtualListBox data-overflow ref={setVirtualListRef} tabIndex={-1}>
      <PointerOverlay ref={setPointerOverlayRef} />
      <VirtualListChildBox
        // $height={getTotalSize()}
        $height={totalHeight}
        flex={1}
        paddingBottom={1}
        ref={setChildContainerRef}
      >
        {children}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
