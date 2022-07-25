import {RefObject, useCallback, useEffect, useRef} from 'react'

export function useInputFocusManager(
  {
    inputRef,
    menuContainerRef,
  }: {
    inputRef: RefObject<HTMLInputElement>
    menuContainerRef: RefObject<HTMLDivElement>
  },
  dependencyList: ReadonlyArray<any> = []
): void {
  const selectedIndexRef = useRef<number>(-1)
  const totalItemCountRef = useRef<number>(0)

  // Iterate through all menu child items, assign aria-selected state and scroll into view
  const setActiveIndex = useCallback(
    (index?: number) => {
      if (typeof index === 'number') {
        selectedIndexRef.current = index
      }

      if (menuContainerRef?.current) {
        Array.from(menuContainerRef.current.children)?.forEach((child, childIndex) => {
          if (childIndex === index) {
            child.setAttribute('aria-selected', 'true')
            // TODO: prefer `block: 'nearest'` and fix positioning issues with sticky headers / footers
            child.scrollIntoView({block: 'center'})
          } else {
            child.setAttribute('aria-selected', 'false')
          }
        })
      }
    },
    [menuContainerRef]
  )

  // Reset active index and disable tab indicies from all menu children whenever dependencies are updated
  // TODO: consider MutationObserver usage
  useEffect(() => {
    const menuContainerEl = menuContainerRef?.current

    if (menuContainerEl) {
      Array.from(menuContainerEl.children)?.forEach((child) => {
        child.setAttribute('tabindex', '-1')
      })
    }

    totalItemCountRef.current = menuContainerEl ? menuContainerEl.childElementCount : 0
    setActiveIndex(-1)
  }, [
    menuContainerRef,
    setActiveIndex,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...dependencyList,
  ])

  useEffect(() => {
    const inputElement = inputRef?.current

    function handleBlur() {
      setActiveIndex(-1)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current < totalItemCountRef.current - 1
            ? selectedIndexRef.current + 1
            : 0
        setActiveIndex(nextIndex)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const nextIndex =
          selectedIndexRef.current > 0
            ? selectedIndexRef.current - 1
            : totalItemCountRef.current - 1
        setActiveIndex(nextIndex)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const currentElement = Array.from(menuContainerRef.current?.children)[
          selectedIndexRef.current
        ] as HTMLElement
        if (currentElement) {
          currentElement.click()
        }
      }
    }

    inputElement?.addEventListener('keydown', handleKeyDown)
    inputElement?.addEventListener('blur', handleBlur)
    return () => {
      inputElement?.removeEventListener('keydown', handleKeyDown)
      inputElement?.removeEventListener('keydown', handleBlur)
    }
  }, [inputRef, menuContainerRef, setActiveIndex])

  return null
}
