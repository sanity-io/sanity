import {useEffect, useState} from 'react'

/**
 * Subscribe to the rect of a DOM element.
 * @internal
 */
export function useElementRect(element: HTMLElement | null): DOMRectReadOnly | null {
  const [rect, setRect] = useState<DOMRectReadOnly | null>(null)

  useEffect(() => {
    if (!element) return undefined

    const ro = new ResizeObserver((entries) => {
      setRect(entries[0].contentRect)
    })

    ro.observe(element)

    return () => ro.disconnect()
  }, [element])

  return rect
}
