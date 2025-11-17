import {useEffect, useRef, useState, type RefObject} from 'react'

/**
 * Detects when a component transitions from hidden to visible.
 */
export function useVisibilityDetection(parentRef: RefObject<HTMLElement | null>): {
  isVisible: boolean
  mountKey: number
} {
  const [isVisible, setIsVisible] = useState(true)
  const [mountKey, setMountKey] = useState(0)
  const prevVisible = useRef(true)

  useEffect(() => {
    const checkVisibility = () => {
      if (!parentRef.current) return

      const isNowVisible = parentRef.current.closest('[hidden]') === null
      const wasVisible = prevVisible.current

      if (wasVisible === isNowVisible) return

      const becameVisible = !wasVisible && isNowVisible

      prevVisible.current = isNowVisible
      setIsVisible(isNowVisible)

      // When transitioning from hidden to visible, increment mount key to force remount
      if (becameVisible) {
        setMountKey((prev) => prev + 1)
      }
    }

    checkVisibility()

    const observer = new MutationObserver(checkVisibility)

    if (parentRef.current) {
      // Observe document body for any hidden attribute changes in the tree
      // Using subtree:true is more efficient than observing each ancestor individually
      observer.observe(document.body, {
        subtree: true, // Watch all descendants
        attributes: true,
        attributeFilter: ['hidden'],
      })
    }

    return () => observer.disconnect()
  }, [parentRef])

  return {isVisible, mountKey}
}
