import {useEffect, useEffectEvent} from 'react'

export function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void,
): void {
  const handleResize = useEffectEvent((entry: ResizeObserverEntry) => {
    onResize(entry)
  })
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((e) => e.target === element)
      if (entry) {
        handleResize(entry)
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [element])
}
