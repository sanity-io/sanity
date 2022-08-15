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
import {VIRTUAL_LIST_OVERSCAN} from '../../constants'

/**
 * This provider adds the following:
 * - Keyboard navigation + events (↑ / ↓ / ENTER) to children with a specified container (`childContainerRef`)
 * - Focus redirection when clicking child elements
 * - Pointer blocking when navigating with arrow keys (to ensure that only one active state is visible at any given time)
 *
 * Requirements:
 * - All child items must have `data-index` attributes defined with their index in the list. This is to help with
 * interoperability with virtual lists (whilst preventing costly re-renders)
 * - You have to supply `childCount` which is the total number of list items. Again, this is specifically for virtual
 * list support.
 * - All child items have to use the supplied context functions (`onChildClick` etc) to ensure consistent behaviour
 * when clicking and hovering over items, as well as preventing unwanted focus.
 * - All elements (including the pointer overlay) have to be set up and passed to this Provider.
 */

/**
 * @todo We should look to either create an dynamic pointer overlay in future, or create a custom list item component
 * with more control over dynamically applying (and removing) hover states.
 */

interface CommandListContextValue {
  onChildClick: () => void
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
}

const CommandListContext = createContext<CommandListContextValue | undefined>(undefined)

interface CommandListProviderProps {
  autoFocus?: boolean
  children?: ReactNode
  childContainerElement: HTMLDivElement
  childCount: number
  containerElement: HTMLDivElement
  headerInputElement: HTMLInputElement
  initialIndex?: number
  pointerOverlayElement: HTMLDivElement
  virtualList?: boolean
  wraparound?: boolean
}

/**
 * @internal
 */
export function CommandListProvider({
  autoFocus,
  children,
  childContainerElement,
  childCount,
  containerElement,
  initialIndex = 0,
  headerInputElement,
  pointerOverlayElement,
  virtualList,
  wraparound = true,
}: CommandListProviderProps) {
  const isMounted = useRef(false)
  const selectedIndexRef = useRef<number>(null)

  const enableChildContainerPointerEvents = useCallback(
    (enabled: boolean) =>
      pointerOverlayElement?.setAttribute('data-enabled', (!enabled).toString()),
    [pointerOverlayElement]
  )

  /**
   * Assign selected state on all child elements.
   */
  const handleAssignSelectedState = useCallback(
    (scrollSelectedIntoView?: boolean) => {
      const childElements = Array.from(childContainerElement?.children || []) as HTMLElement[]
      childElements?.forEach((child) => {
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
    [childContainerElement]
  )

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
   * Set active index on initial mount
   */
  useEffect(() => {
    setActiveIndex({index: initialIndex})
  }, [childCount, initialIndex, setActiveIndex])

  /**
   * Reset active index on child count changes (after initial mount)
   */
  useEffect(() => {
    if (isMounted.current) {
      setActiveIndex({index: 0})
    }
    isMounted.current = true
  }, [childCount, setActiveIndex])

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
        const wraparoundIndex = wraparound ? 0 : selectedIndexRef.current
        let nextIndex =
          selectedIndexRef.current < childCount - 1 ? selectedIndexRef.current + 1 : wraparoundIndex

        /**
         * If the next target element cannot be found (e.g. you've scrolled and it no longer exists in the DOM),
         * select the element closest to the top of the container viewport (factoring in overscan).
         */
        if (virtualList) {
          const foundElement = childElements.find((el) => Number(el.dataset.index) === nextIndex)
          if (!foundElement) {
            nextIndex = Number(childElements[VIRTUAL_LIST_OVERSCAN]?.dataset?.index)
          }
        }

        setActiveIndex({index: nextIndex})
        enableChildContainerPointerEvents(false)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const wraparoundIndex = wraparound ? childCount - 1 : selectedIndexRef.current
        let nextIndex =
          selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : wraparoundIndex

        /**
         * If the next target element cannot be found (e.g. you've scrolled and it no longer exists in the DOM),
         * select the element closest to the bottom of the container viewport (factoring in overscan).
         */
        if (virtualList) {
          const foundElement = childElements.find((el) => Number(el.dataset.index) === nextIndex)
          if (!foundElement) {
            nextIndex = Number(
              childElements[childElements.length - VIRTUAL_LIST_OVERSCAN]?.dataset?.index
            )
          }
        }

        setActiveIndex({index: nextIndex})
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
    wraparound,
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
