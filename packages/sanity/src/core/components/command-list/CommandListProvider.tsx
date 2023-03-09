import {useGlobalKeyDown} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import React, {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
import {CommandListContext} from './context'
import {CommandListProviderProps, ScrollElementProps} from './types'
import {createControlElementId} from './utils'

export function CommandListProvider(props: CommandListProviderProps) {
  const {children, items, height, itemHeight, overScan = 0, multiSelect} = props
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [scrollableElement, setScrollableElement] = useState<HTMLDivElement | null>(null)
  const lastDirection = useRef<'up' | 'down' | 'initial'>('initial')

  const commandListId = useId()
  const listId = useMemo(() => createControlElementId(commandListId), [commandListId])

  const {getVirtualItems, getTotalSize, scrollToIndex} = useVirtualizer({
    count: items.length,
    estimateSize: () => itemHeight,
    getScrollElement: () => scrollableElement,
    overscan: overScan,
  })

  const totalHeight = getTotalSize()

  const ScrollElement = useMemo(
    () =>
      function ScrollElementComponent(scrollElProps: ScrollElementProps) {
        return (
          <div
            ref={setScrollableElement}
            role="listbox"
            style={{height, overflow: 'auto', width: '100%'}}
            id={listId}
          >
            <div
              aria-multiselectable={multiSelect ? 'true' : 'false'}
              style={{
                height: `${totalHeight}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {scrollElProps.children}
            </div>
          </div>
        )
      },
    [height, listId, multiSelect, totalHeight]
  )

  const handleNextItem = useCallback(() => {
    setActiveIndex((prevIndex) => {
      return (prevIndex + 1) % items.length
    })
  }, [items.length])

  const handlePrevItem = useCallback(() => {
    setActiveIndex((prevIndex) => {
      return (prevIndex - 1 + items.length) % items.length
    })
  }, [items.length])

  // Navigate the list with arrow keys
  useGlobalKeyDown((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      lastDirection.current = 'down'
      handleNextItem()
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      lastDirection.current = 'up'
      handlePrevItem()
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const activeElement = scrollableElement?.querySelector(
        '[aria-selected="true"]'
      ) as HTMLElement

      activeElement?.click()
    }
  })

  // Scroll to active item
  useEffect(() => {
    scrollToIndex(activeIndex)
  }, [scrollToIndex, activeIndex])

  // If the active item is disabled, find the next enabled item
  useEffect(() => {
    if (!scrollableElement) return
    const activeElement = scrollableElement.querySelector('[aria-selected="true"]') as HTMLElement
    const isDisabled = activeElement?.hasAttribute('disabled') || false

    if (lastDirection.current === 'down' || lastDirection.current === 'initial') {
      if (isDisabled) {
        handleNextItem()
      }
    }

    if (lastDirection.current === 'up') {
      if (isDisabled) {
        handlePrevItem()
      }
    }
  }, [scrollableElement, handleNextItem, handlePrevItem, activeIndex])

  const virtualItems = getVirtualItems().map((virtualItem) => ({
    context: {
      ...virtualItem,
      active: activeIndex === virtualItem.index,
    },
    item: items[virtualItem.index],
  }))

  return (
    <CommandListContext.Provider
      value={{ScrollElement, items, virtualItems, activeIndex, commandListId}}
    >
      {children}
    </CommandListContext.Provider>
  )
}
