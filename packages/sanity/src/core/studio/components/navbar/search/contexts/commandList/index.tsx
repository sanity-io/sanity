import throttle from 'lodash/throttle'
import React, {
  createContext,
  MouseEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {supportsTouch} from '../../utils/supportsTouch'

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
 * - You have to supply `childCount` which is the total number of list items. Again, this is specifically for virtual
 * list support.
 * - All child items have to use the supplied context functions (`onChildClick` etc) to ensure consistent behaviour
 * when clicking and hovering over items, as well as preventing unwanted focus.
 * - All elements (including the pointer overlay) must be defined and passed to this Provider.
 */

/**
 * TODO: We should look to either create an dynamic pointer overlay in future, or create a custom list item component
 * with more control over dynamically applying (and removing) hover states.
 */

interface CommandListContextValue {
  level: number
  onChildClick: () => void
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  setVirtualListScrollToIndex: (scrollToIndex: (index: number, options?: any) => void) => void
}

const CommandListContext = createContext<CommandListContextValue | undefined>(undefined)

// Allowable tag names to pass through click events when selecting with the ENTER key
const CLICKABLE_CHILD_TAGS: string[] = ['a', 'button']

interface CommandListProviderProps {
  ariaChildrenLabel: string
  ariaHeaderLabel: string
  ariaMultiselectable?: boolean
  autoFocus?: boolean
  children?: ReactNode
  childContainerElement: HTMLDivElement | null
  childCount: number
  containerElement: HTMLDivElement | null
  headerInputElement: HTMLInputElement | null
  id: string
  initialSelectedIndex?: number
  level: number
  pointerOverlayElement: HTMLDivElement | null
  virtualList?: boolean
}

/**
 * @internal
 */
export function CommandListProvider({
  ariaChildrenLabel,
  ariaHeaderLabel,
  ariaMultiselectable = false,
  autoFocus,
  children,
  childContainerElement,
  childCount,
  containerElement,
  id,
  initialSelectedIndex = 0,
  level = 0,
  headerInputElement,
  pointerOverlayElement,
  virtualList,
}: CommandListProviderProps) {
  const selectedIndexRef = useRef<number>(-1)

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
      return `${id}-item-${index}`
    },
    [id]
  )

  /**
   * Assign selected state on all child elements.
   */
  const handleAssignSelectedState = useCallback(
    (scrollSelectedIntoView?: boolean) => {
      const selectedIndex = selectedIndexRef?.current

      headerInputElement?.setAttribute('aria-activedescendant', getChildDescendantId(selectedIndex))

      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      childElements?.forEach((child) => {
        // Derive id from data-index attribute - especially relevant when dealing with virtual lists
        const childIndex = Number(child.dataset?.index)

        child.setAttribute('aria-posinset', (childIndex + 1).toString())
        child.setAttribute('aria-setsize', childCount.toString())
        child.setAttribute('data-active', (childIndex === selectedIndex).toString())
        child.setAttribute('id', getChildDescendantId(childIndex))
        child.setAttribute('role', 'option')
        child.setAttribute('tabIndex', '-1')
      })

      /**
       * Scroll into view: delegate to `react-virtual` if a virtual list, otherwise use `scrollIntoView`
       */
      if (scrollSelectedIntoView) {
        if (virtualList) {
          virtualListScrollToIndexRef?.current?.(selectedIndex, {align: 'start'})
        } else {
          const selectedElement = childElements.find(
            (element) => Number(element.dataset?.index) === selectedIndex
          )
          selectedElement?.scrollIntoView({block: 'nearest'})
        }
      }
    },
    [childContainerElement, childCount, getChildDescendantId, headerInputElement, virtualList]
  )

  /**
   * Throttled version of the above, used when DOM mutations are detected in virtual lists
   */
  const handleReassignSelectedStateThrottled = useMemo(
    () => throttle(handleAssignSelectedState.bind(undefined, false), 200),
    [handleAssignSelectedState]
  )

  /**
   * Mark an index as active, assign aria-selected state on all children and optionally scroll into view
   */
  const setActiveIndex = useCallback(
    ({index, scrollIntoView = true}: {index: number; scrollIntoView?: boolean}) => {
      selectedIndexRef.current = index
      handleAssignSelectedState(scrollIntoView)
    },
    [handleAssignSelectedState]
  )

  /**
   * Prevent child items from receiving focus
   */
  const handleChildMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault()
  }, [])

  /**
   * Always focus header input on child item click (non-touch only)
   */
  const handleChildClick = useCallback(() => {
    if (!supportsTouch) {
      headerInputElement?.focus()
    }
  }, [headerInputElement])

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
        nextIndex = selectedIndexRef.current < childCount - 1 ? selectedIndexRef.current + 1 : 0
      }
      if (direction === 'previous') {
        nextIndex = selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : childCount - 1
      }

      // Delegate scrolling to virtual list if necessary
      if (virtualList) {
        virtualListScrollToIndexRef?.current?.(nextIndex)
        setActiveIndex({index: nextIndex, scrollIntoView: false})
      } else {
        setActiveIndex({index: nextIndex})
      }

      enableChildContainerPointerEvents(false)
    },
    [childCount, enableChildContainerPointerEvents, setActiveIndex, virtualList]
  )

  /**
   * Set active index whenever initial index changes
   */
  useEffect(() => {
    setActiveIndex({index: initialSelectedIndex, scrollIntoView: true})
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
          (el) => Number(el.dataset.index) === selectedIndexRef.current
        )

        if (currentElement) {
          // Find the closest available clickable element - if not the current element, then query its children.
          const clickableElement = CLICKABLE_CHILD_TAGS.includes(
            currentElement.tagName.toLowerCase()
          )
            ? currentElement
            : (currentElement.querySelector(CLICKABLE_CHILD_TAGS.join(',')) as HTMLElement)
          clickableElement?.click()
        }
      }
    }
    headerInputElement?.addEventListener('keydown', handleKeyDown)
    return () => {
      headerInputElement?.removeEventListener('keydown', handleKeyDown)
    }
  }, [childContainerElement, headerInputElement, scrollToAdjacentItem])

  /**
   * Listen to keyboard arrow events on the 'closest' parent [data-overflow] element to the child container.
   * On arrow press: focus the header input element and then navigate accordingly.
   *
   * Done to account for when users focus a wrapping element with overflow (by dragging its scroll handle)
   * and then try navigate with the keyboard.
   */
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        headerInputElement?.focus()
        scrollToAdjacentItem('next')
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        headerInputElement?.focus()
        scrollToAdjacentItem('previous')
      }
    }

    const parentOverflowElement = childContainerElement?.closest('[data-overflow]')
    parentOverflowElement?.addEventListener('keydown', handleKeydown as EventListener)
    return () => {
      parentOverflowElement?.removeEventListener('keydown', handleKeydown as EventListener)
    }
  }, [childContainerElement, headerInputElement, scrollToAdjacentItem])

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
  }, [containerElement, headerInputElement])

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
  }, [childCount, enableChildContainerPointerEvents])

  /**
   * If this is a virtual list - re-assign aria-selected state on all child elements on any DOM mutations.
   *
   * Useful since virtual lists will constantly mutate the DOM on scroll, and we want to ensure that
   * new elements coming into view are rendered with the correct selected state.
   */
  useEffect(() => {
    if (!virtualList) {
      return undefined
    }

    const mutationObserver = new MutationObserver(handleReassignSelectedStateThrottled)

    if (childContainerElement) {
      mutationObserver.observe(childContainerElement, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      mutationObserver.disconnect()
    }
  }, [childContainerElement, handleReassignSelectedStateThrottled, virtualList])

  /**
   * Apply initial attributes
   */
  useEffect(() => {
    childContainerElement?.setAttribute('aria-multiselectable', ariaMultiselectable.toString())
    childContainerElement?.setAttribute('aria-label', ariaChildrenLabel)
    childContainerElement?.setAttribute('id', `${id}-children`)
    childContainerElement?.setAttribute('role', 'listbox')

    containerElement?.setAttribute('data-level', level.toString())

    headerInputElement?.setAttribute('aria-autocomplete', 'list')
    headerInputElement?.setAttribute('aria-expanded', 'true')
    headerInputElement?.setAttribute('aria-controls', `${id}-children`)
    headerInputElement?.setAttribute('aria-label', ariaHeaderLabel)
    headerInputElement?.setAttribute('role', 'combobox')

    pointerOverlayElement?.setAttribute('data-enabled', 'true')
  }, [
    ariaChildrenLabel,
    ariaHeaderLabel,
    ariaMultiselectable,
    childContainerElement,
    containerElement,
    headerInputElement,
    id,
    level,
    pointerOverlayElement,
  ])

  /**
   * Focus header input on mount (non-touch only)
   */
  useEffect(() => {
    if (autoFocus) {
      if (!supportsTouch) {
        headerInputElement?.focus()
      }
    }
  }, [autoFocus, headerInputElement])

  return (
    <CommandListContext.Provider
      value={{
        level,
        onChildClick: handleChildClick,
        onChildMouseDown: handleChildMouseDown,
        onChildMouseEnter: handleChildMouseEnter,
        setVirtualListScrollToIndex: handleSetVirtualListScrollToIndex,
      }}
    >
      {children}
    </CommandListContext.Provider>
  )
}

export function useCommandList() {
  const context = useContext(CommandListContext)
  if (context === undefined) {
    throw new Error('useCommandList must be used within a CommandListProvider')
  }
  return context
}
