import {useEffect, useState} from 'react'

export interface ContentSize {
  width: number
  height: number
}

/**
 * The content box of an element, kept current by a `ResizeObserver` that is created every time
 * the effect runs. `@sanity/ui`'s `useElementSize` shares one observer per element and drops it
 * when its last subscriber leaves without forgetting the element, so a later subscription to the
 * same node is never observed again. That is what happens when a hidden `<Activity>` tears the
 * effects down and shows the tool again with its DOM intact (`beta.reactActivityMode`).
 * Returns `null` until the first measurement.
 */
export function useContentSize(element: HTMLElement | null): ContentSize | null {
  const [size, setSize] = useState<ContentSize | null>(null)

  useEffect(() => {
    if (!element) return undefined

    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1)
      if (!entry) return
      const {width, height} = entry.contentRect
      setSize((current) =>
        current && current.width === width && current.height === height ? current : {width, height},
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return size
}
