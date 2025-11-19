import {type RefObject, useEffect, useRef, useState} from 'react'

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
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const {width, height} = entry.contentRect
      const isNowVisible = width > 0 && height > 0
      const wasVisible = prevVisible.current

      if (wasVisible === isNowVisible) return

      const becameVisible = !wasVisible && isNowVisible

      prevVisible.current = isNowVisible
      setIsVisible(isNowVisible)

      if (becameVisible) {
        setMountKey((prev) => prev + 1)
      }
    })

    if (parentRef.current) {
      resizeObserver.observe(parentRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [parentRef])

  return {isVisible, mountKey}
}
