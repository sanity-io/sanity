import {Box, ResponsivePaddingProps} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {CommandListItem} from './CommandListItem'
import {useCommandList} from './useCommandList'

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

type VirtualListChildBoxProps = {
  $height: number
}
const VirtualListChildBox = styled(Box) //
  .attrs<VirtualListChildBoxProps>(({$height}) => ({
    style: {height: `${$height}px`},
  }))<VirtualListChildBoxProps>`
  position: relative;
  width: 100%;
`

/**
 * @internal
 */
export function CommandListItems(props: ResponsivePaddingProps) {
  const {
    fixedHeight,
    itemComponent: Item,
    itemIndices,
    setChildContainerElement,
    setPointerOverlayElement,
    setVirtualListElement,
    values,
    virtualizer,
  } = useCommandList()

  return (
    <VirtualListBox ref={setVirtualListElement} tabIndex={-1}>
      <PointerOverlayDiv aria-hidden="true" ref={setPointerOverlayElement} />

      {virtualizer && (
        <VirtualListChildBox
          $height={virtualizer.getTotalSize()}
          flex={1}
          ref={setChildContainerElement}
          {...props}
        >
          {virtualizer.getVirtualItems().map((virtualRow, index) => {
            const value = values[virtualRow.index]
            return (
              <CommandListItem
                activeIndex={itemIndices[virtualRow.index] ?? -1}
                data-index={virtualRow.index}
                fixedHeight={fixedHeight}
                key={virtualRow.key}
                measure={fixedHeight ? undefined : virtualizer.measureElement}
                virtualRow={virtualRow}
              >
                {Item && (
                  <Item
                    disabled={value.disabled}
                    index={index}
                    selected={value.selected}
                    value={value.value}
                    virtualIndex={virtualRow.index}
                  />
                )}
              </CommandListItem>
            )
          })}
        </VirtualListChildBox>
      )}
    </VirtualListBox>
  )
}
