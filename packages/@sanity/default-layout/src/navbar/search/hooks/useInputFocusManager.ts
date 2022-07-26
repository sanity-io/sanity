import {RefObject, useCallback, useEffect, useRef} from 'react'

export function useInputFocusManager(
  {
    childContainerRef,
    inputRef,
    onChildItemClick,
  }: {
    childContainerRef: RefObject<HTMLDivElement>
    inputRef: RefObject<HTMLInputElement>
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
      if (event.key === 'Enter') {
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
    const inputElement = inputRef?.current

    // Clear child active index when input element loses focus
    function handleInputBlur() {
      setActiveIndex({index: -1})
    }

    inputElement?.addEventListener('keydown', handleKeyDown)
    inputElement?.addEventListener('blur', handleInputBlur)
    return () => {
      inputElement?.removeEventListener('keydown', handleKeyDown)
      inputElement?.removeEventListener('keydown', handleInputBlur)
    }
  }, [childContainerRef, handleKeyDown, inputRef, setActiveIndex])

  return null
}
