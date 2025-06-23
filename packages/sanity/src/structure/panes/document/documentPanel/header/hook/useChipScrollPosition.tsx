import {useEffect, useState} from 'react'

/**
 * This hook is used to determine if the gradient should be shown on the chip scroll container.
 * It uses an IntersectionObserver to observe the last child of the container and sets the showGradient state based on the intersection.
 * @param containerRef - The ref to the container that contains all the chips
 * @returns showGradient - A boolean that determines if the gradient should be shown
 * @internal
 */
export function useChipScrollPosition(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [showGradient, setShowGradient] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      // container is the parent that contains all the chips
      const container = containerRef.current
      if (!container) return
      const {scrollWidth, clientWidth} = container
      const needsScrolling = scrollWidth > clientWidth

      if (!needsScrolling) {
        setShowGradient(false)
        return
      }

      // Check if scrolled to the end
      // becausee it doesn't need to show the gradient then
      const {scrollLeft} = container
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth
      setShowGradient(!isAtEnd)
    }

    function setupObservers() {
      checkOverflow()
      // container is the parent that contains all the chips
      const container = containerRef.current
      if (!container) return {observer: null}

      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0]

        if (entry) {
          setShowGradient(entry.isIntersecting)
        }
      })

      const lastChip = container.children[container.children.length - 1]
      observer.observe(lastChip)

      return {observer}
    }

    const {observer} = setupObservers()

    return () => {
      observer?.disconnect()
    }
  }, [containerRef])

  return showGradient
}
