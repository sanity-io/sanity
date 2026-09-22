import {type RefObject, useEffect, useState} from 'react'

export interface ElementSize {
  width: number
  height: number
}

/** The content box size of an element, tracked with a ResizeObserver (zero until measured) */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({width: 0, height: 0})

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return undefined
    }
    const rect = element.getBoundingClientRect()
    setSize({width: rect.width, height: rect.height})

    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({width: entry.contentRect.width, height: entry.contentRect.height})
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
