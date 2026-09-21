import {type RefObject, useEffect, useRef, useState} from 'react'

/**
 * Returns a key that changes each time the element goes from hidden (zero width) back to visible,
 * so the caller can remount a virtualizer that measured itself while hidden: a field inside a hidden
 * `TabPanel` sizes to nothing on first render and only lays out once the panel shows.
 *
 * Callers keep their list mounted while hidden and remount only on the way back. A Suspense
 * fallback hides committed content the same way (`display: none`); unmounting the list there would
 * drop its pending item, let the boundary re-show the form, remount the list and suspend again in a
 * loop.
 */
export function useVisibilityDetection(parentRef: RefObject<HTMLElement | null>): {
  mountKey: number
} {
  const [mountKey, setMountKey] = useState(0)
  const prevVisible = useRef(true)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const isNowVisible = entry.contentRect.width > 0
      if (prevVisible.current === isNowVisible) return

      prevVisible.current = isNowVisible
      if (isNowVisible) {
        setMountKey((prev) => prev + 1)
      }
    })

    if (parentRef.current) {
      resizeObserver.observe(parentRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [parentRef])

  return {mountKey}
}
