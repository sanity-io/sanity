import {useCallback, useMemo, useRef, useState} from 'react'

export type ScrollElement = HTMLDivElement | null

function isElementVisibleInContainer(container: ScrollElement, element: ScrollElement) {
  if (!container || !element) return true

  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  // 32.5px is padding on published/draft element + padding of perspective/draft menu item
  const isVisible = elementRect.top >= containerRect.top + 32.5 * 2

  return isVisible
}

export const useScrollIndicatorVisibility = () => {
  const scrollContainerRef = useRef<ScrollElement>(null)
  const scrollElementRef = useRef<ScrollElement>(null)

  const [isRangeVisible, setIsRangeVisible] = useState(true)

  const handleScroll = useCallback(
    () =>
      setIsRangeVisible(
        isElementVisibleInContainer(scrollContainerRef.current, scrollElementRef.current),
      ),
    [],
  )

  const setScrollContainer = useCallback((container: HTMLDivElement) => {
    scrollContainerRef.current = container
  }, [])

  const resetRangeVisibility = useCallback(() => setIsRangeVisible(true), [])

  return useMemo(
    () => ({
      resetRangeVisibility,
      onScroll: handleScroll,
      isRangeVisible,
      setScrollContainer,
      scrollElementRef,
    }),
    [handleScroll, isRangeVisible, resetRangeVisibility, setScrollContainer],
  )
}
