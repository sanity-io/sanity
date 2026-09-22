import {type RefObject, useEffect, useState} from 'react'

/** Whether the element is narrower than `breakpoint`, tracked with a ResizeObserver */
export function useIsNarrow(ref: RefObject<HTMLElement | null>, breakpoint: number): boolean {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  )

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setIsNarrow(entry.contentRect.width < breakpoint)
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [breakpoint, ref])

  return isNarrow
}
