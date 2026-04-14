import {useEffect} from 'react'

export function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void,
): void {
  useEffect(() => {
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
