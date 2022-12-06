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
import {isNonNullable} from '../../../../../../util'
import {VIRTUAL_LIST_SEARCH_ITEM_HEIGHT} from '../../constants'
import {supportsTouch} from '../../utils/supportsTouch'
import {CommandListContext} from './CommandListContext'

/**
 * This provider adds the following:
 * - Keyboard navigation + events (↑ / ↓ / ENTER) to children with a specified container (`childContainerRef`)
 * - Focus redirection when clicking child elements
 * - Pointer blocking when navigating with arrow keys (to ensure that only one active state is visible at any given time)
 * - ARIA attributes to define a `combobox` header input that controls a separate `listbox`
 *
 * Requirements:
 * - All child items must have `data-index` attributes defined with their index in the list. This is to help with
 * interoperability with virtual lists (whilst preventing costly re-renders)
 * - You have to supply `itemIndices`, an array of (number | null) indicating active indices only.
 * e.g. `[0, null, 1, 2]` indicates a list of 4 items, where the second item is non-interactive (such as a header or divider)
 * - All child items have to use the supplied context functions (`onChildMouseDown` etc) to ensure consistent behaviour
 * when clicking and hovering over items, as well as preventing unwanted focus.
 */

interface CommandListProviderProps {
  ariaActiveDescendant?: boolean
  ariaChildrenLabel: string
  ariaHeaderLabel: string
  ariaMultiselectable?: boolean
  autoFocus?: boolean
  children?: ReactNode
  initialSelectedIndex?: number
  itemIndices: (number | null)[]
  itemIndicesSelected?: boolean[]
}

/**
 * @internal
 */
export function CommandListProvider({
  ariaActiveDescendant = true,
  ariaChildrenLabel,
  ariaHeaderLabel,
  ariaMultiselectable = false,
  autoFocus,
  children,
  initialSelectedIndex,
  itemIndices,
  itemIndicesSelected,
}: CommandListProviderProps) {
  const selectedIndexRef = useRef<number>(-1)
  const [childContainerElement, setChildContainerElement] = useState<HTMLDivElement | null>(null)
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null)
  const [headerInputElement, setHeaderInputElement] = useState<HTMLDivElement | null>(null)
  const [pointerOverlayElement, setPointerOverlayElement] = useState<HTMLDivElement | null>(null)

  const activeItemCount = itemIndices.filter(isNonNullable).length

  const commandListId = useId()

  const virtualListScrollToIndexRef = useRef<
    ((index: number, options?: Record<string, any>) => void) | null
  >(null)

  /**
   * Toggle pointer overlay element which will kill existing hover states
   */
  const enableChildContainerPointerEvents = useCallback(
    (enabled: boolean) =>
      pointerOverlayElement?.setAttribute('data-enabled', (!enabled).toString()),
    [pointerOverlayElement]
  )

  const getChildDescendantId = useCallback(
    (index: number) => {
      return `${commandListId}-item-${index}`
    },
    [commandListId]
  )

  /**
   * Assign selected state on all child elements.
   */
  const handleAssignSelectedState = useCallback(() => {
    const selectedIndex = selectedIndexRef?.current
    if (ariaActiveDescendant) {
      headerInputElement?.setAttribute('aria-activedescendant', getChildDescendantId(selectedIndex))
    } else {
      headerInputElement?.removeAttribute('aria-activedescendant')
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
        child.setAttribute('data-active', (childIndex === selectedIndex).toString())
        child.setAttribute('id', getChildDescendantId(childIndex))
        child.setAttribute('role', 'option')
        child.setAttribute('tabIndex', '-1')
      }
    })
  }, [
    activeItemCount,
    ariaActiveDescendant,
    childContainerElement,
    getChildDescendantId,
    headerInputElement,
    itemIndices,
    itemIndicesSelected,
  ])

  /**
   * Throttled version of the above, used when DOM mutations are detected in virtual lists
   */
  const handleAssignSelectedStateThrottled = useMemo(
    () => throttle(handleAssignSelectedState, 200),
    [handleAssignSelectedState]
  )

  /**
   * Query search result children for the 'top most' visible element (factoring in overscan)
   * and obtain its index.
   */
  // @todo This only currently returns accurate values for search results.
  // Consider initializing virtual list within this provider and remove hard-coded values.
  const handleGetTopIndex = useCallback(() => {
    const childContainerParentElement = childContainerElement?.parentElement
    if (childContainerParentElement && childContainerElement) {
      const childContainerParentElementTop = childContainerParentElement.getBoundingClientRect().top
      const childContainerElementTop = childContainerElement.getBoundingClientRect().top
      const index = Math.floor(
        (childContainerParentElementTop - childContainerElementTop) /
          VIRTUAL_LIST_SEARCH_ITEM_HEIGHT
      )
      return index
    }
    return -1
  }, [childContainerElement])

  /**
   * Mark an index as active, assign aria-selected state on all children and optionally scroll into view
   */
  const setActiveIndex = useCallback(
    ({
      index,
      scrollAlign = false,
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
        virtualListScrollToIndexRef?.current?.(
          virtualListIndex,
          scrollAlign ? {align: 'start'} : {}
        )
      }
    },
    [handleAssignSelectedState, itemIndices]
  )

  /**
   * Focus header input element (non-touch only)
   */
  const handleFocusHeaderInputElement = useCallback(() => {
    if (!supportsTouch) {
      headerInputElement?.focus()
    }
  }, [headerInputElement])

  /**
   * Focus header input on child item mousedown and prevent nested elements from receiving focus.
   */
  const handleChildMouseDown = useCallback(
    (event: MouseEvent) => {
      handleFocusHeaderInputElement()
      event.preventDefault()
    },
    [handleFocusHeaderInputElement]
  )

  /**
   * Mark hovered child item as active
   */
  const handleChildMouseEnter = useCallback(
    (index: number) => {
      return function () {
        setActiveIndex({index, scrollIntoView: false})
      }
    },
    [setActiveIndex]
  )

  /**
   * Store virtual list's scrollToIndex function
   */
  const handleSetVirtualListScrollToIndex = useCallback(
    (scrollToIndex: (index: number, options?: Record<string, any>) => void) => {
      virtualListScrollToIndexRef.current = scrollToIndex
    },
    []
  )

  const scrollToAdjacentItem = useCallback(
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

      // Scroll into view with `react-virtual`
      setActiveIndex({index: nextIndex, scrollIntoView: true})
      enableChildContainerPointerEvents(false)
    },
    [activeItemCount, enableChildContainerPointerEvents, setActiveIndex]
  )

  /**
   * Set active index whenever initial index changes
   */
  useEffect(() => {
    if (typeof initialSelectedIndex !== 'undefined') {
      setActiveIndex({index: initialSelectedIndex, scrollAlign: true, scrollIntoView: true})
    }
  }, [initialSelectedIndex, setActiveIndex])

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
   * Listen to keyboard events on header input element
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]

      if (!childElements.length) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        scrollToAdjacentItem('next')
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        scrollToAdjacentItem('previous')
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const currentElement = childElements.find(
          (el) => Number(el.dataset.index) === itemIndices.indexOf(selectedIndexRef.current)
        )

        if (currentElement) {
          const clickableElement = currentElement?.querySelector(
            '[data-command-list-item]'
          ) as HTMLElement
          clickableElement?.click()
        }
      }
    }
    headerInputElement?.addEventListener('keydown', handleKeyDown)
    return () => {
      headerInputElement?.removeEventListener('keydown', handleKeyDown)
    }
  }, [childContainerElement, headerInputElement, itemIndices, scrollToAdjacentItem])

  /**
   * Listen to keyboard arrow events on the container element.
   * On arrow press: focus the header input element and then navigate accordingly.
   *
   * Done to account for when users focus a wrapping element with overflow (by dragging its scroll handle)
   * and then try navigate with the keyboard.
   */
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        handleFocusHeaderInputElement()
        scrollToAdjacentItem('next')
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        handleFocusHeaderInputElement()
        scrollToAdjacentItem('previous')
      }
    }

    containerElement?.addEventListener('keydown', handleKeydown as EventListener)
    return () => {
      containerElement?.removeEventListener('keydown', handleKeydown as EventListener)
    }
  }, [
    childContainerElement,
    containerElement,
    handleFocusHeaderInputElement,
    headerInputElement,
    scrollToAdjacentItem,
  ])

  /**
   * Track focus / blur state on the list's input element and store state in `data-focused` attribute on
   * a separate container element.
   */
  useEffect(() => {
    function handleMarkContainerAsFocused(focused: boolean) {
      return () => containerElement?.setAttribute('data-focused', focused.toString())
    }

    headerInputElement?.addEventListener('blur', handleMarkContainerAsFocused(false))
    headerInputElement?.addEventListener('focus', handleMarkContainerAsFocused(true))
    return () => {
      headerInputElement?.removeEventListener('blur', handleMarkContainerAsFocused(false))
      headerInputElement?.removeEventListener('focus', handleMarkContainerAsFocused(true))
    }
  }, [children, containerElement, headerInputElement])

  /**
   * Track mouse enter / leave state on child container and store state in `data-hovered` attribute on
   * a separate container element.
   */
  useEffect(() => {
    function handleMarkChildrenAsHovered(hovered: boolean) {
      return () => containerElement?.setAttribute('data-hovered', hovered.toString())
    }

    childContainerElement?.addEventListener('mouseenter', handleMarkChildrenAsHovered(true))
    childContainerElement?.addEventListener('mouseleave', handleMarkChildrenAsHovered(false))
    return () => {
      childContainerElement?.removeEventListener('mouseenter', handleMarkChildrenAsHovered(true))
      childContainerElement?.removeEventListener('mouseleave', handleMarkChildrenAsHovered(false))
    }
  }, [childContainerElement, containerElement])

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
    childContainerElement?.setAttribute('aria-multiselectable', ariaMultiselectable.toString())
    childContainerElement?.setAttribute('aria-label', ariaChildrenLabel)
    childContainerElement?.setAttribute('role', 'listbox')

    containerElement?.setAttribute('id', `${commandListId}-children`)

    headerInputElement?.setAttribute('aria-autocomplete', 'list')
    headerInputElement?.setAttribute('aria-expanded', 'true')
    headerInputElement?.setAttribute('aria-controls', `${commandListId}-children`)
    headerInputElement?.setAttribute('aria-label', ariaHeaderLabel)
    headerInputElement?.setAttribute('role', 'combobox')

    pointerOverlayElement?.setAttribute('data-enabled', 'true')
  }, [
    ariaChildrenLabel,
    ariaHeaderLabel,
    ariaMultiselectable,
    childContainerElement,
    commandListId,
    containerElement,
    headerInputElement,
    pointerOverlayElement,
  ])

  /**
   * Focus header input on mount (non-touch only)
   */
  useEffect(() => {
    if (autoFocus) {
      handleFocusHeaderInputElement()
    }
  }, [autoFocus, handleFocusHeaderInputElement])

  return (
    <CommandListContext.Provider
      value={{
        focusHeaderInputElement: handleFocusHeaderInputElement,
        getTopIndex: handleGetTopIndex,
        itemIndices,
        onChildMouseDown: handleChildMouseDown,
        onChildMouseEnter: handleChildMouseEnter,
        setChildContainerElement,
        setContainerElement,
        setHeaderInputElement,
        setPointerOverlayElement,
        setVirtualListScrollToIndex: handleSetVirtualListScrollToIndex,
      }}
    >
      {children}
    </CommandListContext.Provider>
  )
}
