import {RefObject, useCallback, useEffect, useRef} from 'react'

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
    onChildItemClick,
  }: {
    childContainerRef: RefObject<HTMLDivElement>
    containerRef: RefObject<HTMLElement>
    onChildItemClick?: () => void
  },
  dependencyList: ReadonlyArray<any> = []
): void {
  const selectedIndexRef = useRef<number>(-1)
  const totalItemCountRef = useRef<number>(0)

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
              // TODO: prefer `block: 'nearest'` and fix positioning issues with sticky headers / footers
              child.scrollIntoView({block: 'center'})
            }
          } else {
            child.setAttribute('aria-selected', 'false')
          }
        })
      }
    },
    [childContainerRef]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const eventTargetElement = event.target as HTMLElement
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current < totalItemCountRef.current - 1
            ? selectedIndexRef.current + 1
            : 0
        setActiveIndex({index: nextIndex})
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current > 0
            ? selectedIndexRef.current - 1
            : totalItemCountRef.current - 1
        setActiveIndex({index: nextIndex})
      }
      if (event.key === 'Enter' && eventTargetElement.tagName.toLowerCase() === 'input') {
        event.preventDefault()
        const currentElement = Array.from(childContainerRef.current?.children)[
          selectedIndexRef.current
        ] as HTMLElement
        if (currentElement) {
          currentElement.click()
        }
      }
    },
    [childContainerRef, setActiveIndex]
  )

  /**
   * On mount and whenever dependencies are updated:
   * - Reset active index
   * - Recalculate children count
   * - On all child items: disable tab indices and register click + keydown events
   *
   * We assign keydown events to all children to retain up/down navigation even after a child
   * item has been clicked (and has received focus).
   */
  useEffect(() => {
    function handleChildItemClick(index: number) {
      return function () {
        setActiveIndex({index, scrollIntoView: false})
        onChildItemClick?.()
      }
    }

    const childContainerEl = childContainerRef?.current

    totalItemCountRef.current = childContainerEl ? childContainerEl.childElementCount : 0
    setActiveIndex({index: -1})

    if (childContainerEl) {
      Array.from(childContainerEl.children)?.forEach((child, index) => {
        child.setAttribute('tabindex', '-1')
        child.addEventListener('click', handleChildItemClick(index))
        child.addEventListener('keydown', handleKeyDown)
      })
    }

    return () => {
      if (childContainerEl) {
        Array.from(childContainerEl.children)?.forEach((child, index) => {
          child.removeEventListener('click', handleChildItemClick(index))
          child.removeEventListener('keydown', handleKeyDown)
        })
      }
    }
  }, [
    childContainerRef,
    handleKeyDown,
    onChildItemClick,
    setActiveIndex,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...dependencyList,
  ])

  useEffect(() => {
    const containerElement = containerRef?.current

    // Clear child active index when input element loses focus
    function handleContainerBlur() {
      setActiveIndex({index: -1})
    }

    containerElement?.addEventListener('keydown', handleKeyDown)
    containerElement?.addEventListener('blur', handleContainerBlur)
    return () => {
      containerElement?.removeEventListener('keydown', handleKeyDown)
      containerElement?.removeEventListener('blur', handleContainerBlur)
    }
  }, [childContainerRef, containerRef, handleKeyDown, setActiveIndex])

  return null
}
