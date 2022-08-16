import {throttle} from 'lodash'
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
 * @todo We should look to either create an dynamic pointer overlay in future, or create a custom list item component
 * with more control over dynamically applying (and removing) hover states.
 */

interface CommandListContextValue {
  onChildClick: () => void
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  setVirtualListScrollToIndex: (
    scrollToIndex: (index: number, options: Record<string, any>) => void
  ) => void
}

const CommandListContext = createContext<CommandListContextValue | undefined>(undefined)

interface CommandListProviderProps {
  ariaChildrenLabel: string
  ariaHeaderLabel: string
  ariaMultiselectable?: boolean
  autoFocus?: boolean
  children?: ReactNode
  childContainerElement: HTMLDivElement
  childCount: number
  containerElement: HTMLDivElement
  headerInputElement: HTMLInputElement
  id: string
  initialSelectedIndex?: number
  pointerOverlayElement: HTMLDivElement
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
  headerInputElement,
  pointerOverlayElement,
  virtualList,
}: CommandListProviderProps) {
  const selectedIndexRef = useRef<number>(null)

  const virtualListScrollToIndex = useRef<(index: number, options?: Record<string, any>) => void>(
    null
  )

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
      headerInputElement?.setAttribute(
        'aria-activedescendant',
        getChildDescendantId(selectedIndexRef.current)
      )

      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      childElements?.forEach((child) => {
        // Derive id from data-index attribute - especially relevant when dealing with virtual lists
        const childIndex = Number(child.dataset?.index)

        child.setAttribute('aria-posinset', (childIndex + 1).toString())
        child.setAttribute('aria-setsize', childCount.toString())
        child.setAttribute('id', getChildDescendantId(childIndex))
        child.setAttribute('role', 'option')
        child.setAttribute('tabIndex', '-1')

        if (Number(child.dataset.index) === selectedIndexRef.current) {
          if (scrollSelectedIntoView) {
            child.scrollIntoView({block: 'nearest'})
          }
          child.setAttribute('aria-selected', 'true')
        } else {
          child.setAttribute('aria-selected', 'false')
        }
      })
    },
    [childContainerElement, childCount, getChildDescendantId, headerInputElement]
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
   * Always focus header input on child item click
   */
  const handleChildClick = useCallback(() => {
    headerInputElement?.focus()
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
      virtualListScrollToIndex.current = scrollToIndex
    },
    []
  )

  /**
   * Update active index, scroll virtual list if applicable
   */
  useEffect(() => {
    setActiveIndex({index: initialSelectedIndex})

    if (
      typeof initialSelectedIndex === 'number' &&
      virtualList &&
      virtualListScrollToIndex.current
    ) {
      virtualListScrollToIndex.current(initialSelectedIndex, {align: 'start'})
    }
  }, [initialSelectedIndex, setActiveIndex, virtualList])

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
        const nextIndex =
          selectedIndexRef.current < childCount - 1 ? selectedIndexRef.current + 1 : 0

        // Delegate scrolling to virtual list if necessary
        if (virtualList) {
          virtualListScrollToIndex?.current(nextIndex)
          setActiveIndex({index: nextIndex, scrollIntoView: false})
        } else {
          setActiveIndex({index: nextIndex})
        }

        enableChildContainerPointerEvents(false)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : childCount - 1

        // Delegate scrolling to virtual list if necessary
        if (virtualList) {
          virtualListScrollToIndex?.current(nextIndex)
          setActiveIndex({index: nextIndex, scrollIntoView: false})
        } else {
          setActiveIndex({index: nextIndex})
        }

        enableChildContainerPointerEvents(false)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const currentElement = childElements.find(
          (el) => Number(el.dataset.index) === selectedIndexRef.current
        )
        if (currentElement) {
          currentElement.click()
        }
      }
    }
    headerInputElement?.addEventListener('keydown', handleKeyDown)
    return () => {
      headerInputElement?.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    childContainerElement,
    childCount,
    enableChildContainerPointerEvents,
    headerInputElement,
    setActiveIndex,
    virtualList,
  ])

  /**
   * Track focus / blur state on the list's input element and store state in `data-focused` attribute on
   * a separate container element.
   *
   * The `data-focused` attribute is used to define styles on components enriched with
   * `withCommandListItemStyles`
   *
   * @see withCommandListItemStyles
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
   *
   * The `data-hovered` attribute is used to define styles on components enriched with
   * `withCommandListItemStyles`
   *
   * @see withCommandListItemStyles
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
  }, [childContainerElement, childCount, handleReassignSelectedStateThrottled, virtualList])

  /**
   * Apply initial aria attributes
   */
  useEffect(() => {
    headerInputElement?.setAttribute('aria-autocomplete', 'list')
    headerInputElement?.setAttribute('aria-expanded', 'true')
    headerInputElement?.setAttribute('aria-controls', `${id}-children`)
    headerInputElement?.setAttribute('aria-label', ariaHeaderLabel)
    headerInputElement?.setAttribute('role', 'combobox')

    childContainerElement?.setAttribute('aria-multiselectable', ariaMultiselectable.toString())
    childContainerElement?.setAttribute('aria-label', ariaChildrenLabel)
    childContainerElement?.setAttribute('id', `${id}-children`)
    childContainerElement?.setAttribute('role', 'listbox')
  }, [
    ariaChildrenLabel,
    ariaHeaderLabel,
    ariaMultiselectable,
    childContainerElement,
    headerInputElement,
    id,
  ])

  /**
   * Focus header input on mount
   */
  useEffect(() => {
    if (autoFocus) {
      headerInputElement?.focus()
    }
  }, [autoFocus, headerInputElement])

  return (
    <CommandListContext.Provider
      value={{
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
