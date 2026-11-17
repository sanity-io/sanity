import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

export type ScrollElement = HTMLElement | null

function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement
  while (current) {
    const {overflowY} = getComputedStyle(current)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return current
    }
    current = current.parentElement
  }
  return null
}

function isElementVisibleInContainer(container: ScrollElement, element: ScrollElement): boolean {
  if (!container || !element) return true

  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  // 32.5px is padding on published/draft element + padding of perspective/draft menu item
  const isVisible = elementRect.top >= containerRect.top + 32.5 * 2

  return isVisible
}

export const useScrollIndicatorVisibility = () => {
  const scrollElementRef = useRef<ScrollElement>(null)
  const scrollAncestorRef = useRef<HTMLElement | null>(null)

  const [isRangeVisible, setIsRangeVisible] = useState(true)

  const handleScroll = useCallback(
    () =>
      setIsRangeVisible(
        isElementVisibleInContainer(scrollAncestorRef.current, scrollElementRef.current),
      ),
    [],
  )

  const setScrollContainer = useCallback(
    (container: HTMLElement | null) => {
      const previousAncestor = scrollAncestorRef.current
      if (previousAncestor) {
        previousAncestor.removeEventListener('scroll', handleScroll)
        scrollAncestorRef.current = null
      }

      if (container) {
        const scrollableAncestor = findScrollableAncestor(container)
        scrollAncestorRef.current = scrollableAncestor

        if (scrollableAncestor) {
          scrollableAncestor.addEventListener('scroll', handleScroll, {passive: true})
        }
      }
    },
    [handleScroll],
  )

  useEffect(() => {
    return () => {
      const ancestor = scrollAncestorRef.current
      if (ancestor) {
        ancestor.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  const resetRangeVisibility = useCallback(() => setIsRangeVisible(true), [])

  return useMemo(
    () => ({
      resetRangeVisibility,
      isRangeVisible,
      setScrollContainer,
      scrollElementRef,
    }),
    [isRangeVisible, resetRangeVisibility, setScrollContainer],
  )
}
