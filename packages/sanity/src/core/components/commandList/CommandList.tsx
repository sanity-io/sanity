import {Box} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import throttle from 'lodash/throttle'
import React, {
  forwardRef,
  MouseEvent,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'
import {supportsTouch} from '../../util'
import {CommandListItem} from './CommandListItem'
import {CommandListHandle, CommandListProps} from './types'

// Data attribute to assign to the current active virtual list element
const LIST_ITEM_DATA_ATTR_ACTIVE = 'data-active'
// Selector to find the first interactive element in the virtual list element
const LIST_ITEM_INTERACTIVE_SELECTOR = 'a,button'

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
 * This provider adds the following:
 * - Keyboard navigation + events (↑ / ↓ / ENTER) to children with a specified container (`childContainerRef`)
 * - Focus redirection when clicking child elements
 * - Pointer blocking when navigating with arrow keys (to ensure that only one active state is visible at any given time)
 * - ARIA attributes to define a `combobox` input that controls a separate `listbox`
 *
 * @internal
 */
export const CommandList = forwardRef<CommandListHandle, CommandListProps<T>>(function CommandList(
  {
    activeItemDataAttr = LIST_ITEM_DATA_ATTR_ACTIVE,
    ariaLabel,
    ariaMultiselectable = false,
    autoFocus,
    fixedHeight,
    getItemKey,
    initialScrollAlign = 'start',
    initialIndex,
    inputElement,
    itemHeight,
    overscan,
    renderItem,
    values,
    ...responsivePaddingProps
  },
  ref
) {
  const activeIndexRef = useRef(initialIndex ?? 0)

  const [childContainerElement, setChildContainerElement] = useState<HTMLDivElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayElement] = useState<HTMLDivElement | null>(null)
  const [virtualListElement, setVirtualListElement] = useState<HTMLDivElement | null>(null)

  const activeItemCount = values.filter((v) => !v.disabled).length

  // This will trigger a re-render whenever its internal state changes
  const virtualizer = useVirtualizer({
    count: values.length,
    getItemKey,
    getScrollElement: () => virtualListElement,
    estimateSize: () => itemHeight,
    overscan,
  })

  /**
   * An array of (number | null) indicating active indices.
   * e.g. `[0, null, 1, 2]` indicates a list of 4 items, where the second item is non-interactive (such as a heading or divider)
   */
  const itemIndices = useMemo(() => {
    let i = -1
    return values.reduce<(number | null)[]>((acc, val, index) => {
      const isEnabled = !val.disabled
      if (isEnabled) {
        i += 1
      }
      acc[index] = isEnabled ? i : null
      return acc
    }, [])
  }, [values])

  /**
   * An array of (boolean) indicating selected indices.
   * e.g. `[true, false, false, true]` indicates a list of 4 items, where the first and last items are selected.
   */
  const itemIndicesSelected = useMemo(() => {
    return values.map((v) => !!v.selected)
  }, [values])

  const commandListId = useId()

  /**
   * Toggle pointer overlay element which will kill existing hover states
   */
  const enableChildContainerPointerEvents = useCallback(
    (enabled: boolean) =>
      pointerOverlayElement?.setAttribute('data-enabled', (!enabled).toString()),
    [pointerOverlayElement]
  )

  const getChildDescendantId = useCallback(
    (index: number) => `${commandListId}-item-${index}`,
    [commandListId]
  )

  /**
   * Iterate through all virtual list children and apply the active data-attribute on the selected index.
   */
  const showChildrenActiveState = useCallback(
    (activeIndex: number | null) => {
      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      childElements?.forEach((child) => {
        const virtualIndex = Number(child.dataset?.index)
        const childIndex = itemIndices[virtualIndex]
        child
          .querySelector(LIST_ITEM_INTERACTIVE_SELECTOR)
          ?.toggleAttribute(activeItemDataAttr, childIndex === activeIndex)
      })
    },
    [activeItemDataAttr, childContainerElement, itemIndices]
  )

  /**
   * Assign active state on all child elements.
   */
  const handleAssignActiveState = useCallback(() => {
    const activeIndex = activeIndexRef?.current
    if (values.length > 0) {
      inputElement?.setAttribute('aria-activedescendant', getChildDescendantId(activeIndex))
    } else {
      inputElement?.removeAttribute('aria-activedescendant')
    }
    const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
    childElements?.forEach((child) => {
      const virtualIndex = Number(child.dataset?.index)
      const childIndex = itemIndices[virtualIndex]
      if (typeof childIndex === 'number') {
        child.setAttribute('aria-posinset', (childIndex + 1).toString())
        child.setAttribute('aria-selected', itemIndicesSelected[virtualIndex].toString())
        child.setAttribute('aria-setsize', activeItemCount.toString())
        child.setAttribute('id', getChildDescendantId(childIndex))
        child.setAttribute('role', 'option')
        child.setAttribute('tabIndex', '-1')
      }
    })
    showChildrenActiveState(activeIndex)
  }, [
    activeItemCount,
    childContainerElement,
    getChildDescendantId,
    inputElement,
    itemIndices,
    itemIndicesSelected,
    showChildrenActiveState,
    values.length,
  ])

  /**
   * Throttled version of the above, used when DOM mutations are detected in virtual lists
   */
  const handleAssignActiveStateThrottled = useMemo(
    () => throttle(handleAssignActiveState, 200),
    [handleAssignActiveState]
  )

  /**
   * Obtain index of the top most visible element
   */
  const handleGetTopIndex = useCallback(() => {
    const childContainerParentElement = childContainerElement?.parentElement
    if (childContainerElement && childContainerParentElement) {
      const offset =
        childContainerParentElement.getBoundingClientRect().top -
        childContainerElement.getBoundingClientRect().top
      return virtualizer.getVirtualItemForOffset(offset)?.index ?? -1
    }
    return -1
  }, [childContainerElement, virtualizer])

  /**
   * Mark an index as active, re-assign aria attrs on all children and optionally scroll into view
   */
  const setActiveIndex = useCallback(
    ({
      index,
      scrollAlign,
      scrollIntoView = true,
    }: {
      index: number
      scrollAlign?: boolean
      scrollIntoView?: boolean
    }) => {
      activeIndexRef.current = index
      handleAssignActiveState()

      if (scrollIntoView) {
        const virtualListIndex = itemIndices.indexOf(index)
        if (virtualListIndex > -1) {
          virtualizer.scrollToIndex(
            virtualListIndex,
            scrollAlign ? {align: initialScrollAlign} : {}
          )
        }
      }
    },
    [handleAssignActiveState, initialScrollAlign, itemIndices, virtualizer]
  )

  /**
   * Select adjacent virtual item index and scroll into view with `react-virtual`
   */
  const selectAdjacentItemIndex = useCallback(
    (direction: 'previous' | 'next') => {
      let nextIndex = -1
      if (direction === 'next') {
        nextIndex = activeIndexRef.current < activeItemCount - 1 ? activeIndexRef.current + 1 : 0
      }
      if (direction === 'previous') {
        nextIndex = activeIndexRef.current > 0 ? activeIndexRef.current - 1 : activeItemCount - 1
      }
      setActiveIndex({index: nextIndex, scrollIntoView: true})
      enableChildContainerPointerEvents(false)
    },
    [activeItemCount, enableChildContainerPointerEvents, setActiveIndex]
  )

  /**
   * Focus input / virtual list element (non-touch only)
   */
  const focusElement = useCallback(() => {
    if (!supportsTouch) {
      if (inputElement) {
        inputElement?.focus()
      } else if (virtualListElement) {
        virtualListElement?.focus()
      }
    }
  }, [inputElement, virtualListElement])

  /**
   * Focus input / virtual list element on child item mousedown and prevent nested elements from receiving focus.
   */
  const handleChildMouseDown = useCallback(
    (event: MouseEvent) => {
      focusElement()
      event.preventDefault()
    },
    [focusElement]
  )

  /**
   * Mark hovered child item as active
   */
  const handleChildMouseEnter = useCallback(
    (index: number) => () => {
      setActiveIndex({index, scrollIntoView: false})
    },
    [setActiveIndex]
  )

  /**
   * Handle keyboard events:
   * - Up/down arrow: scroll to adjacent items
   * - Enter: trigger click events on the current active element
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      if (!childElements.length) {
        return
      }

      // Re-focus current element (input / virtual list element)
      focusElement()

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        selectAdjacentItemIndex('next')
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        selectAdjacentItemIndex('previous')
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const currentElement = childElements.find(
          (el) => Number(el.dataset.index) === itemIndices.indexOf(activeIndexRef.current)
        )

        if (currentElement) {
          const clickableElement = currentElement?.querySelector<HTMLElement>(
            LIST_ITEM_INTERACTIVE_SELECTOR
          )
          clickableElement?.click()
        }
      }
    },
    [childContainerElement?.children, focusElement, itemIndices, selectAdjacentItemIndex]
  )

  useImperativeHandle(
    ref,
    () => {
      return {
        focusElement() {
          focusElement()
        },
        getTopIndex() {
          return handleGetTopIndex()
        },
        scrollToIndex(index: number) {
          setActiveIndex({index})
          enableChildContainerPointerEvents(true)
        },
      }
    },
    [enableChildContainerPointerEvents, focusElement, handleGetTopIndex, setActiveIndex]
  )

  /**
   * Set active index (and align) on mount, and whenever initial index changes
   */
  useEffect(() => {
    if (typeof initialIndex !== 'undefined') {
      setActiveIndex({index: initialIndex, scrollAlign: true, scrollIntoView: true})
    }
  }, [initialIndex, setActiveIndex])

  /**
   * Re-enable child pointer events on any mouse move event
   */
  useEffect(() => {
    function handleMouseMove() {
      enableChildContainerPointerEvents(true)
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [enableChildContainerPointerEvents])

  /**
   * Listen to keyboard / blur / focus events on both input element (if present) and the virtual list element.
   *
   * We still listen to events on the container to handle scenarios where the input element is not present
   * or when users focus via dragging the overflow scroll handle.
   */
  useEffect(() => {
    function handleBlur() {
      showChildrenActiveState(null)
    }
    function handleFocus() {
      showChildrenActiveState(activeIndexRef.current)
    }

    const elements = [inputElement, virtualListElement]
    elements.forEach((el) => {
      el?.addEventListener('blur', handleBlur)
      el?.addEventListener('focus', handleFocus)
      el?.addEventListener('keydown', handleKeyDown)
    })
    return () => {
      elements.forEach((el) => {
        el?.removeEventListener('blur', handleBlur)
        el?.removeEventListener('focus', handleFocus)
        el?.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [focusElement, handleKeyDown, inputElement, showChildrenActiveState, virtualListElement])

  /**
   * Temporarily disable pointer events (or 'flush' existing hover states) on child count changes.
   */
  useEffect(() => {
    enableChildContainerPointerEvents(false)
  }, [activeItemCount, enableChildContainerPointerEvents])

  /**
   * Refresh selected state when item values change (as a result of filtering).
   * This is to ensure that we correctly clear aria-activedescendant attrs if the filtered array is empty.
   */
  useEffect(() => {
    handleAssignActiveState()
  }, [handleAssignActiveState, values])

  /**
   * Re-assign aria-selected state on all child elements on any DOM mutations.
   *
   * Useful since virtual lists will constantly mutate the DOM on scroll, and we want to ensure that
   * new elements coming into view are rendered with the correct selected state.
   */
  useEffect(() => {
    const mutationObserver = new MutationObserver(handleAssignActiveStateThrottled)

    if (childContainerElement) {
      mutationObserver.observe(childContainerElement, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      mutationObserver.disconnect()
    }
  }, [childContainerElement, handleAssignActiveStateThrottled])

  /**
   * Apply initial attributes
   */
  useEffect(() => {
    childContainerElement?.setAttribute('aria-label', ariaLabel)
    childContainerElement?.setAttribute('aria-multiselectable', ariaMultiselectable.toString())
    childContainerElement?.setAttribute('role', 'listbox')

    inputElement?.setAttribute('aria-autocomplete', 'list')
    inputElement?.setAttribute('aria-expanded', 'true')
    inputElement?.setAttribute('aria-controls', `${commandListId}-children`)
    inputElement?.setAttribute('role', 'combobox')
    pointerOverlayElement?.setAttribute('data-enabled', 'true')
    virtualListElement?.setAttribute('id', `${commandListId}-children`)
  }, [
    ariaLabel,
    ariaMultiselectable,
    childContainerElement,
    commandListId,
    inputElement,
    pointerOverlayElement,
    virtualListElement,
  ])

  /**
   * Focus input / virtual list element on mount (non-touch only)
   */
  useEffect(() => {
    if (autoFocus) {
      focusElement()
    }
  }, [autoFocus, focusElement])

  return (
    <VirtualListBox ref={setVirtualListElement} tabIndex={-1}>
      <PointerOverlayDiv aria-hidden="true" ref={setPointerOverlayElement} />

      {virtualizer && (
        <VirtualListChildBox
          $height={virtualizer.getTotalSize()}
          flex={1}
          ref={setChildContainerElement}
          {...responsivePaddingProps}
        >
          {virtualizer.getVirtualItems().map((virtualRow, index) => {
            const value = values[virtualRow.index]

            const itemToRender = renderItem({
              index,
              virtualIndex: virtualRow.index,
              ...value,
            }) as React.ReactElement
            return (
              <CommandListItem
                activeIndex={itemIndices[virtualRow.index] ?? -1}
                data-index={virtualRow.index}
                fixedHeight={fixedHeight}
                key={virtualRow.key}
                measure={fixedHeight ? undefined : virtualizer.measureElement}
                onChildMouseDown={handleChildMouseDown}
                onChildMouseEnter={handleChildMouseEnter}
                virtualRow={virtualRow}
              >
                {itemToRender}
              </CommandListItem>
            )
          })}
        </VirtualListChildBox>
      )}
    </VirtualListBox>
  )
})
