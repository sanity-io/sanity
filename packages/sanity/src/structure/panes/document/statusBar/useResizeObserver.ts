import {useLayoutEffect} from 'react'

export function useResizeObserver({
  element,
  onResize,
}: {
  element?: HTMLDivElement | null
  onResize: (event: ResizeObserverEntry) => void
}): void {
  useLayoutEffect(() => {
    if (!element) return undefined

    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((e) => e.target === element)
      if (entry) {
        onResize(entry)
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [element, onResize])
}
