import {throttle} from 'lodash'
import React, {
  createContext,
  MouseEvent,
  ReactNode,
  RefObject,
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
  children?: ReactNode
  childContainerRef: RefObject<HTMLDivElement>
  childCount: number
  containerRef: RefObject<HTMLDivElement>
  headerInputRef: RefObject<HTMLInputElement>
  initialIndex?: number
  pointerOverlayRef: RefObject<HTMLDivElement>
  virtualList?: boolean
  wraparound?: boolean
}

/**
 * @internal
 */
export function CommandListProvider({
  children,
  childContainerRef,
  childCount,
  containerRef,
  initialIndex = 0,
  headerInputRef,
  pointerOverlayRef,
  virtualList,
  wraparound = true,
}: CommandListProviderProps) {
  const isMounted = useRef(false)
  const selectedIndexRef = useRef<number>(null)

  const enableChildContainerPointerEvents = useCallback(
    (enabled: boolean) => {
      if (pointerOverlayRef?.current) {
        pointerOverlayRef.current.setAttribute('data-enabled', (!enabled).toString())
      }
    },
    [pointerOverlayRef]
  )

  /**
   * Assign selected state on all child elements.
   */
  const handleAssignSelectedState = useCallback(
    (scrollSelectedIntoView?: boolean) => {
      const childElements = Array.from(childContainerRef?.current?.children || []) as HTMLElement[]
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
    [childContainerRef]
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
    headerInputRef.current?.focus()
  }, [headerInputRef])

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
    const headerInputElement = headerInputRef?.current

    function handleKeyDown(event: KeyboardEvent) {
      const childElements = Array.from(childContainerRef?.current?.children || []) as HTMLElement[]

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
    childContainerRef,
    childCount,
    enableChildContainerPointerEvents,
    headerInputRef,
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
    function handleMarkChildenAsFocused(focused: boolean) {
      return () => containerRef?.current?.setAttribute('data-focused', focused.toString())
    }

    const inputElement = headerInputRef?.current
    inputElement?.addEventListener('blur', handleMarkChildenAsFocused(false))
    inputElement?.addEventListener('focus', handleMarkChildenAsFocused(true))
    return () => {
      inputElement?.removeEventListener('blur', handleMarkChildenAsFocused(false))
      inputElement?.removeEventListener('focus', handleMarkChildenAsFocused(true))
    }
  }, [containerRef, headerInputRef])

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
      return () => containerRef?.current?.setAttribute('data-hovered', hovered.toString())
    }

    const childContainerElement = childContainerRef?.current
    childContainerElement?.addEventListener('mouseenter', handleMarkChildrenAsHovered(true))
    childContainerElement?.addEventListener('mouseleave', handleMarkChildrenAsHovered(false))
    return () => {
      childContainerElement?.removeEventListener('mouseenter', handleMarkChildrenAsHovered(true))
      childContainerElement?.removeEventListener('mouseleave', handleMarkChildrenAsHovered(false))
    }
  }, [childContainerRef, containerRef])

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

    const childContainerElement = childContainerRef?.current

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
  }, [childContainerRef, childCount, handleReassignSelectedStateThrottled, virtualList])

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
