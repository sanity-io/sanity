import {RefObject, useCallback, useEffect, useRef, useState} from 'react'

/**
 * This hook adds keyboard events (up arrow / down arrow / enter keys) to a specified container element.
 *
 * Up / down arrow key presses on the container element cycles through all nested elements specified within a
 * separate _child_ container element, applying `aria-selected=true` attributes accordingly.
 *
 * All children of this child container element will not be focusable, and clicking individual children will always re-focus
 * the specified input element.
 *
 * Pressing the enter key will trigger a click event on the selected child element IF the currently focused element is of type <input />.
 * Otherwise, enter key presses pass-through to the event target as normal.
 */
export function useContainerArrowNavigation(
  {
    childContainerRef,
    childContainerParentRef,
    headerInputRef,
    pointerOverlayRef,
  }: {
    childContainerRef: RefObject<HTMLDivElement>
    childContainerParentRef: RefObject<HTMLDivElement>
    headerInputRef: RefObject<HTMLInputElement>
    pointerOverlayRef: RefObject<HTMLDivElement>
  },
  dependencyList: ReadonlyArray<any> = []
): void {
  const selectedIndexRef = useRef<number>(0)
  const [childElements, setChildElements] = useState<HTMLElement[]>([])

  const enableChildContainerPointerEvents = useCallback(
    (enabled: boolean) => {
      if (pointerOverlayRef?.current) {
        pointerOverlayRef.current.style.display = enabled ? 'none' : 'block'
      }
    },
    [pointerOverlayRef]
  )

  // Iterate through all menu child items, assign aria-selected state and scroll into view
  const setActiveIndex = useCallback(
    ({index, scrollIntoView = true}: {index: number; scrollIntoView?: boolean}) => {
      if (typeof index === 'number') {
        selectedIndexRef.current = index
      }

      if (childContainerRef?.current) {
        Array.from(childContainerRef.current.children)?.forEach((child, childIndex) => {
          if (childIndex === index) {
            child.setAttribute('aria-selected', 'true')
            if (scrollIntoView) {
              child.scrollIntoView({block: 'nearest'})
            }
          } else {
            child.setAttribute('aria-selected', 'false')
          }
        })
      }
    },
    [childContainerRef]
  )

  const handleSetChildren = useCallback(() => {
    const childContainerElement = childContainerRef?.current
    if (childContainerElement) {
      setChildElements(Array.from(childContainerElement.children) as HTMLElement[])
    }
  }, [childContainerRef])

  /**
   * Reset active index and and store child elements in state on initial mount and whenever dependencies are updated
   */
  useEffect(() => {
    setActiveIndex({index: 0})
    handleSetChildren()
  }, [
    handleSetChildren,
    setActiveIndex,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...dependencyList,
  ])

  /**
   * Prevent child elements from receiving focus.
   * Input element should focus whenever a child element is clicked.
   */
  useEffect(() => {
    function handleClick() {
      headerInputRef.current?.focus()
    }

    // Prevent child items from receiving focus (on mouse press)
    function handleMouseDown(event: MouseEvent) {
      event.preventDefault()
    }

    function handleMouseEnter(index: number) {
      return function () {
        setActiveIndex({index, scrollIntoView: false})
      }
    }

    childElements?.forEach((child, index) => {
      child.setAttribute('tabindex', '-1')
      child.addEventListener('click', handleClick)
      child.addEventListener('mousedown', handleMouseDown)
      child.addEventListener('mouseenter', handleMouseEnter(index))
    })

    return () => {
      childElements?.forEach((child, index) => {
        child.removeEventListener('click', handleClick)
        child.removeEventListener('mousedown', handleMouseDown)
        child.removeEventListener('mouseenter', handleMouseEnter(index))
      })
    }
  }, [childElements, headerInputRef, setActiveIndex])

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
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current < childElements.length - 1 ? selectedIndexRef.current + 1 : 0
        setActiveIndex({index: nextIndex})
        enableChildContainerPointerEvents(false)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : childElements.length - 1
        setActiveIndex({index: nextIndex})
        enableChildContainerPointerEvents(false)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const currentElement = childElements[selectedIndexRef.current] as HTMLElement
        if (currentElement) {
          currentElement.click()
        }
      }
    }
    headerInputElement?.addEventListener('keydown', handleKeyDown)
    return () => {
      headerInputElement?.removeEventListener('keydown', handleKeyDown)
    }
  }, [childElements, enableChildContainerPointerEvents, headerInputRef, setActiveIndex])

  /**
   * Track focus / blur state on input element and store state in `data-focused` attribute
   */
  useEffect(() => {
    function handleMarkChildenAsFocused(focused: boolean) {
      return () =>
        childContainerParentRef?.current?.setAttribute('data-focused', focused.toString())
    }

    const inputElement = headerInputRef?.current
    inputElement?.addEventListener('blur', handleMarkChildenAsFocused(false))
    inputElement?.addEventListener('focus', handleMarkChildenAsFocused(true))
    return () => {
      inputElement?.removeEventListener('blur', handleMarkChildenAsFocused(false))
      inputElement?.removeEventListener('focus', handleMarkChildenAsFocused(true))
    }
  }, [childContainerParentRef, headerInputRef])

  /**
   * Track mouse enter / leave state on child container and store state in `data-hovered` attribute
   */
  useEffect(() => {
    function handleMarkChildrenAsHovered(hovered: boolean) {
      return () =>
        childContainerParentRef?.current?.setAttribute('data-hovered', hovered.toString())
    }

    const childContainerElement = childContainerRef?.current
    childContainerElement?.addEventListener('mouseenter', handleMarkChildrenAsHovered(true))
    childContainerElement?.addEventListener('mouseleave', handleMarkChildrenAsHovered(false))
    return () => {
      childContainerElement?.removeEventListener('mouseenter', handleMarkChildrenAsHovered(true))
      childContainerElement?.removeEventListener('mouseleave', handleMarkChildrenAsHovered(false))
    }
  }, [childContainerRef, childContainerParentRef])

  /**
   * Update children on any DOM mutations
   */
  useEffect(() => {
    const childContainerElement = childContainerRef?.current

    const mutationObserver = new MutationObserver(handleSetChildren)

    if (childContainerElement) {
      mutationObserver.observe(childContainerElement, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      mutationObserver.disconnect()
    }
  }, [
    childContainerRef,
    handleSetChildren,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...dependencyList,
  ])

  return null
}
