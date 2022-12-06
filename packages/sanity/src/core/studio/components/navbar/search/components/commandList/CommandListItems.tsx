import {Box, ResponsivePaddingProps} from '@sanity/ui'
import React, {Dispatch, ReactNode, SetStateAction} from 'react'
import styled from 'styled-components'
import {useCommandList} from './useCommandList'

interface CommandListItemsProps extends ResponsivePaddingProps {
  children: ReactNode
  setVirtualListRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  totalHeight: number
}

/*
 * Conditionally appears over command list items to cancel existing :hover states for all child elements.
 * It should only appear if hover capabilities are available (not on touch devices)
 */
const PointerOverlayDiv = styled.div`
  bottom: 0;
  display: none;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;

  @media (hover: hover) {
    &[data-enabled='true'] {
      display: block;
    }
  }
`

const VirtualListBox = styled(Box)`
  height: 100%;
  outline: none;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  width: 100%;
`

const VirtualListChildBox = styled(Box)<{$height: number}>`
  height: ${({$height}) => `${$height}px`};
  position: relative;
  width: 100%;
`

export function CommandListItems({
  children,
  setVirtualListRef,
  totalHeight,
  ...rest
}: CommandListItemsProps) {
  const {setChildContainerElement, setPointerOverlayElement} = useCommandList()

  return (
    <VirtualListBox ref={setVirtualListRef} tabIndex={-1}>
      <PointerOverlayDiv aria-hidden="true" ref={setPointerOverlayElement} />

      <VirtualListChildBox $height={totalHeight} flex={1} ref={setChildContainerElement} {...rest}>
        {children}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
