import {useLayoutEffect} from 'react'
import {resizeObserver} from 'sanity'

export function useResizeObserver({
  element,
  onResize,
}: {
  element?: HTMLDivElement | null
  onResize: (event: ResizeObserverEntry) => void
}): void {
  useLayoutEffect(() => {
    if (element) {
      resizeObserver.observe(element, onResize)
    }

    return () => {
      if (element) {
        resizeObserver.unobserve(element)
      }
    }
  }, [element, onResize])
}
