import type {ScrollToOptions, Virtualizer} from '@tanstack/react-virtual'
import throttle from 'lodash/throttle'
import React, {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {isNonNullable, supportsTouch} from '../../util'
import {CommandListContext} from './CommandListContext'

/**
 * This provider adds the following:
 * - Keyboard navigation + events (↑ / ↓ / ENTER) to children with a specified container (`childContainerRef`)
 * - Focus redirection when clicking child elements
 * - Pointer blocking when navigating with arrow keys (to ensure that only one active state is visible at any given time)
 * - ARIA attributes to define a `combobox` input that controls a separate `listbox`
 */
interface CommandListProviderProps {
  /** The data attribute to apply to any active virtual list items */
  activeItemDataAttr?: string
  ariaActiveDescendant?: boolean
  ariaChildrenLabel?: string
  ariaInputLabel?: string
  ariaMultiselectable?: boolean
  /** Automatically focus the input (if applicable) or virtual list */
  autoFocus?: boolean
  children?: ReactNode
  /** Scroll alignment of the initial selected index */
  initialScrollAlign?: ScrollToOptions['align']
  initialIndex?: number
  /**
   * An array of (number | null) indicating active indices only.
   * e.g. `[0, null, 1, 2]` indicates a list of 4 items, where the second item is non-interactive (such as a heading or divider)
   */
  itemIndices: (number | null)[]
  itemIndicesSelected?: boolean[]
}

// Default data attribute set on interactive elements within virtual list items
const LIST_ITEM_DATA_ATTR = 'data-command-list-item'
// Data attribute to assign to the current active virtual list element
const LIST_ITEM_DATA_ATTR_ACTIVE = 'data-active'

/**
 * @internal
 */
export function CommandListProvider({
  activeItemDataAttr = LIST_ITEM_DATA_ATTR_ACTIVE,
  ariaActiveDescendant = true,
  ariaChildrenLabel,
  ariaInputLabel,
  ariaMultiselectable = false,
  autoFocus,
  children,
  initialScrollAlign = 'start',
  initialIndex,
  itemIndices,
  itemIndicesSelected,
}: CommandListProviderProps) {
  const selectedIndexRef = useRef<number>(-1)
  const [childContainerElement, setChildContainerElement] = useState<HTMLDivElement | null>(null)
  const [inputElement, setInputElement] = useState<HTMLDivElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayElement] = useState<HTMLDivElement | null>(null)
  const [virtualListElement, setVirtualListElement] = useState<HTMLDivElement | null>(null)

  const activeItemCount = itemIndices.filter(isNonNullable).length

  const commandListId = useId()

  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element> | null>(null)

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
    (selectedIndex: number | null) => {
      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      childElements?.forEach((child) => {
        const virtualIndex = Number(child.dataset?.index)
        const childIndex = itemIndices[virtualIndex]
        child
          .querySelector(`[${LIST_ITEM_DATA_ATTR}]`)
          ?.toggleAttribute(activeItemDataAttr, childIndex === selectedIndex)
      })
    },
    [activeItemDataAttr, childContainerElement, itemIndices]
  )

  /**
   * Assign selected state on all child elements.
   */
  const handleAssignSelectedState = useCallback(() => {
    const selectedIndex = selectedIndexRef?.current
    if (ariaActiveDescendant) {
      inputElement?.setAttribute('aria-activedescendant', getChildDescendantId(selectedIndex))
    } else {
      inputElement?.removeAttribute('aria-activedescendant')
    }

    const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
    childElements?.forEach((child) => {
      const virtualIndex = Number(child.dataset?.index)
      const childIndex = itemIndices[virtualIndex]
      if (typeof childIndex === 'number') {
        child.setAttribute('aria-posinset', (childIndex + 1).toString())
        if (itemIndicesSelected) {
          child.setAttribute('aria-selected', itemIndicesSelected[virtualIndex].toString())
        }
        child.setAttribute('aria-setsize', activeItemCount.toString())
        child.setAttribute('id', getChildDescendantId(childIndex))
        child.setAttribute('role', 'option')
        child.setAttribute('tabIndex', '-1')
      }
    })
    showChildrenActiveState(selectedIndex)
  }, [
    activeItemCount,
    ariaActiveDescendant,
    childContainerElement,
    getChildDescendantId,
    inputElement,
    itemIndices,
    itemIndicesSelected,
    showChildrenActiveState,
  ])

  /**
   * Throttled version of the above, used when DOM mutations are detected in virtual lists
   */
  const handleAssignSelectedStateThrottled = useMemo(
    () => throttle(handleAssignSelectedState, 200),
    [handleAssignSelectedState]
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
      return virtualizerRef?.current?.getVirtualItemForOffset(offset)?.index ?? -1
    }
    return -1
  }, [childContainerElement])

  /**
   * Mark an index as active, assign aria-selected state on all children and optionally scroll into view
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
      selectedIndexRef.current = index
      handleAssignSelectedState()

      if (scrollIntoView) {
        const virtualListIndex = itemIndices.indexOf(index)
        virtualizerRef?.current?.scrollToIndex(
          virtualListIndex,
          scrollAlign ? {align: initialScrollAlign} : {}
        )
      }
    },
    [handleAssignSelectedState, initialScrollAlign, itemIndices]
  )

  /**
   * Select adjacent virtual item index and scroll into view with `react-virtual`
   */
  const selectAdjacentItemIndex = useCallback(
    (direction: 'previous' | 'next') => {
      let nextIndex = -1
      if (direction === 'next') {
        nextIndex =
          selectedIndexRef.current < activeItemCount - 1 ? selectedIndexRef.current + 1 : 0
      }
      if (direction === 'previous') {
        nextIndex =
          selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : activeItemCount - 1
      }
      setActiveIndex({index: nextIndex, scrollIntoView: true})
      enableChildContainerPointerEvents(false)
    },
    [activeItemCount, enableChildContainerPointerEvents, setActiveIndex]
  )

  /**
   * Focus input / virtual list element (non-touch only)
   */
  const handleFocusElement = useCallback(() => {
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
      handleFocusElement()
      event.preventDefault()
    },
    [handleFocusElement]
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
          (el) => Number(el.dataset.index) === itemIndices.indexOf(selectedIndexRef.current)
        )

        if (currentElement) {
          const clickableElement = currentElement?.querySelector<HTMLElement>(
            `[${LIST_ITEM_DATA_ATTR}]`
          )
          clickableElement?.click()
        }
      }
    },
    [childContainerElement?.children, itemIndices, selectAdjacentItemIndex]
  )

  /**
   * Store virtualizer instance
   */
  const handleSetVirtualizer = useCallback((virtualizer: Virtualizer<HTMLDivElement, Element>) => {
    virtualizerRef.current = virtualizer
  }, [])

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
    function handleHideChildrenActiveState() {
      showChildrenActiveState(null)
    }
    function handleShowChildrenActiveState() {
      showChildrenActiveState(selectedIndexRef.current)
    }

    const elements = [inputElement, virtualListElement]
    elements.forEach((el) => {
      el?.addEventListener('blur', handleHideChildrenActiveState)
      el?.addEventListener('focus', handleShowChildrenActiveState)
      el?.addEventListener('keydown', handleKeyDown)
    })
    return () => {
      elements.forEach((el) => {
        el?.removeEventListener('blur', handleHideChildrenActiveState)
        el?.removeEventListener('focus', handleShowChildrenActiveState)
        el?.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [handleKeyDown, inputElement, showChildrenActiveState, virtualListElement])

  /**
   * Temporarily disable pointer events (or 'flush' existing hover states) on child count changes.
   */
  useEffect(() => {
    enableChildContainerPointerEvents(false)
  }, [activeItemCount, enableChildContainerPointerEvents])

  /**
   * Refresh selected state when item indices change (as a result of filtering).
   * This is to ensure that we correctly clear aria-activedescendant attrs if the filtered array is empty.
   */
  useEffect(() => {
    handleAssignSelectedState()
  }, [handleAssignSelectedState, itemIndices])

  /**
   * Re-assign aria-selected state on all child elements on any DOM mutations.
   *
   * Useful since virtual lists will constantly mutate the DOM on scroll, and we want to ensure that
   * new elements coming into view are rendered with the correct selected state.
   */
  useEffect(() => {
    const mutationObserver = new MutationObserver(handleAssignSelectedStateThrottled)

    if (childContainerElement) {
      mutationObserver.observe(childContainerElement, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      mutationObserver.disconnect()
    }
  }, [childContainerElement, handleAssignSelectedStateThrottled])

  /**
   * Apply initial attributes
   */
  useEffect(() => {
    if (ariaChildrenLabel) {
      childContainerElement?.setAttribute('aria-label', ariaChildrenLabel)
    }
    childContainerElement?.setAttribute('aria-multiselectable', ariaMultiselectable.toString())
    childContainerElement?.setAttribute('role', 'listbox')

    if (ariaInputLabel) {
      inputElement?.setAttribute('aria-label', ariaInputLabel)
    }
    inputElement?.setAttribute('aria-autocomplete', 'list')
    inputElement?.setAttribute('aria-expanded', 'true')
    inputElement?.setAttribute('aria-controls', `${commandListId}-children`)
    inputElement?.setAttribute('role', 'combobox')
    pointerOverlayElement?.setAttribute('data-enabled', 'true')
    virtualListElement?.setAttribute('id', `${commandListId}-children`)
  }, [
    ariaChildrenLabel,
    ariaInputLabel,
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
      handleFocusElement()
    }
  }, [autoFocus, handleFocusElement])

  return (
    <CommandListContext.Provider
      value={{
        focusElement: handleFocusElement,
        getTopIndex: handleGetTopIndex,
        itemIndices,
        onChildMouseDown: handleChildMouseDown,
        onChildMouseEnter: handleChildMouseEnter,
        setChildContainerElement,
        setInputElement: setInputElement,
        setPointerOverlayElement,
        setVirtualizer: handleSetVirtualizer,
        setVirtualListElement,
        virtualizer: virtualizerRef.current,
        virtualItemDataAttr: {[LIST_ITEM_DATA_ATTR]: ''},
        virtualListElement,
      }}
    >
      {children}
    </CommandListContext.Provider>
  )
}
