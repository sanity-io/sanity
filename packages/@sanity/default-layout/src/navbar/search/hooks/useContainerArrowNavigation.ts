import {RefObject, useCallback, useEffect, useRef, useState} from 'react'

/**
 * This hook adds keyboard events (for up arrow / down arrow / enter keys) to a specified container element.
 *
 * Up / down arrow key presses on the container element will cycle through all nested elements specified within a
 * separate _child_ container element, applying `aria-selected=true` attributes accordingly.
 *
 * All children of this child container element will listen for the same keyboard events. They will also not be focusable.
 *
 * Pressing the enter key triggers a click event on the selected child element IF the currently focused element is of type <input />.
 * Otherwise, enter presses will pass-through to the event target as normal.
 */
export function useContainerArrowNavigation(
  {
    childContainerRef,
    containerRef,
    inputRef,
  }: {
    childContainerRef: RefObject<HTMLDivElement>
    containerRef: RefObject<HTMLDivElement>
    inputRef: RefObject<HTMLInputElement>
  },
  dependencyList: ReadonlyArray<any> = []
): void {
  const selectedIndexRef = useRef<number>(-1)
  const [childElements, setChildElements] = useState<HTMLElement[]>([])

  // Iterate through all menu child items, assign aria-selected state and scroll into view
  const setActiveIndex = useCallback(
    ({index, scrollIntoView = true}: {index?: number; scrollIntoView?: boolean}) => {
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
    setActiveIndex({index: -1})
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
    function handleClick(index: number) {
      return function () {
        inputRef.current?.focus()
      }
    }

    // Prevent child items from receiving focus (on mouse press)
    function handleMouseDown(event: MouseEvent) {
      event.preventDefault()
    }

    childElements?.forEach((child, index) => {
      child.setAttribute('tabindex', '-1')
      child.addEventListener('click', handleClick(index))
      child.addEventListener('mousedown', handleMouseDown)
    })

    return () => {
      childElements?.forEach((child, index) => {
        child.removeEventListener('click', handleClick(index))
        child.removeEventListener('mousedown', handleMouseDown)
      })
    }
  }, [childElements, inputRef, setActiveIndex])

  useEffect(() => {
    // Clear child active index when input element loses focus
    function handleContainerBlur() {
      setActiveIndex({index: -1})
    }

    function handleKeyDown(event: KeyboardEvent) {
      const eventTargetElement = event.target as HTMLElement
      const isInputElement = eventTargetElement.tagName.toLowerCase() === 'input'

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (isInputElement) {
          const nextIndex =
            selectedIndexRef.current < childElements.length - 1 ? selectedIndexRef.current + 1 : 0
          setActiveIndex({index: nextIndex})
        } else {
          inputRef.current?.focus()
        }
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (isInputElement) {
          const nextIndex =
            selectedIndexRef.current > 0 ? selectedIndexRef.current - 1 : childElements.length - 1
          setActiveIndex({index: nextIndex})
        } else {
          inputRef.current?.focus()
        }
      }
      if (event.key === 'Enter' && isInputElement) {
        event.preventDefault()
        const currentElement = childElements[selectedIndexRef.current] as HTMLElement
        if (currentElement) {
          currentElement.click()
        }
      }
    }

    const containerElement = containerRef?.current
    containerElement?.addEventListener('keydown', handleKeyDown)
    containerElement?.addEventListener('blur', handleContainerBlur)
    return () => {
      containerElement?.removeEventListener('keydown', handleKeyDown)
      containerElement?.removeEventListener('blur', handleContainerBlur)
    }
  }, [childContainerRef, childElements, containerRef, inputRef, setActiveIndex])

  /**
   * Listen to DOM mutations
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
  }, [childContainerRef, handleSetChildren])

  return null
}
