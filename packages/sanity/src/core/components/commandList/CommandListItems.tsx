import {Box, ResponsivePaddingProps} from '@sanity/ui'
import {useVirtualizer, VirtualizerOptions} from '@tanstack/react-virtual'
import React, {ReactElement, useEffect} from 'react'
import styled from 'styled-components'
import {CommandListItem} from './CommandListItem'
import {useCommandList} from './useCommandList'

interface CommandListItemsProps extends ResponsivePaddingProps {
  fixedHeight?: boolean
  item: (props: {index: number}) => ReactElement | null
  virtualizerOptions: Pick<
    VirtualizerOptions<HTMLDivElement, Element>,
    'estimateSize' | 'getItemKey' | 'overscan'
  >
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
export function CommandListItems({
  fixedHeight,
  item: Item,
  virtualizerOptions,
  ...rest
}: CommandListItemsProps) {
  const {
    itemIndices,
    setChildContainerElement,
    setPointerOverlayElement,
    setVirtualizer,
    setVirtualListElement,
    virtualListElement,
  } = useCommandList()

  const virtualizer = useVirtualizer({
    ...virtualizerOptions,
    count: itemIndices.length,
    getScrollElement: () => virtualListElement,
  })

  /**
   * Store react-virtual's `virtualizer` instance to shared CommandList context
   */
  useEffect(() => {
    setVirtualizer(virtualizer)
  }, [setVirtualizer, virtualizer])

  return (
    <VirtualListBox ref={setVirtualListElement} tabIndex={-1}>
      <PointerOverlayDiv aria-hidden="true" ref={setPointerOverlayElement} />

      <VirtualListChildBox
        $height={virtualizer.getTotalSize()}
        flex={1}
        ref={setChildContainerElement}
        {...rest}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          return (
            <CommandListItem
              activeIndex={itemIndices[virtualRow.index] ?? -1}
              data-index={virtualRow.index}
              fixedHeight={fixedHeight}
              key={virtualRow.key}
              measure={fixedHeight ? undefined : virtualizer.measureElement}
              virtualRow={virtualRow}
            >
              {Item && <Item index={virtualRow.index} />}
            </CommandListItem>
          )
        })}
      </VirtualListChildBox>
    </VirtualListBox>
  )
}
