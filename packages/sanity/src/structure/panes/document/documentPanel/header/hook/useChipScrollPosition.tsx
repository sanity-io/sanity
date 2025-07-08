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
      if (!container) return {intersectionObserver: null, mutationObserver: null}

      const intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[0]

        if (entry) {
          setShowGradient(!entry.isIntersecting)
        }
      })

      const updateLastChipObserver = () => {
        // Disconnect previous observation
        intersectionObserver.disconnect()

        // Get the new last child
        const lastChip = container.children[container.children.length - 1]
        intersectionObserver.observe(lastChip)
      }

      // Set up initial observation
      updateLastChipObserver()

      // Set up mutation observer to watch for changes to children
      // this is needed because sometimes the list of releases takes some time to be rendered
      // otherwise it could accidentally set the last child as the "drafts" / "published" chip
      const mutationObserver = new MutationObserver(() => {
        updateLastChipObserver()
        checkOverflow()
      })

      mutationObserver.observe(container, {
        childList: true,
        subtree: false,
      })

      return {intersectionObserver, mutationObserver}
    }

    const {intersectionObserver, mutationObserver} = setupObservers()

    return () => {
      intersectionObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [containerRef])

  return showGradient
}
