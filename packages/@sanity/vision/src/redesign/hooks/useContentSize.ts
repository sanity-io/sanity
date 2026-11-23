import {useLayoutEffect, useState} from 'react'

export interface ContentSize {
  width: number
  height: number
}

/**
 * The element's content box, as a `ResizeObserver` reports it: the border box without borders,
 * padding and scrollbars
 */
function measureContentBox(element: HTMLElement): ContentSize {
  const style = getComputedStyle(element)
  const px = (value: string) => parseFloat(value) || 0
  const borderX = px(style.borderLeftWidth) + px(style.borderRightWidth)
  const borderY = px(style.borderTopWidth) + px(style.borderBottomWidth)
  const scrollbarX = Math.max(0, element.offsetWidth - element.clientWidth - borderX)
  const scrollbarY = Math.max(0, element.offsetHeight - element.clientHeight - borderY)
  const {width, height} = element.getBoundingClientRect()
  return {
    width: Math.max(
      0,
      width - borderX - px(style.paddingLeft) - px(style.paddingRight) - scrollbarX,
    ),
    height: Math.max(
      0,
      height - borderY - px(style.paddingTop) - px(style.paddingBottom) - scrollbarY,
    ),
  }
}

/**
 * The content box of an element, kept current by a `ResizeObserver` that is created every time
 * the effect runs. `@sanity/ui`'s `useElementSize` shares one observer per element and drops it
 * when its last subscriber leaves without forgetting the element, so a later subscription to the
 * same node is never observed again. That is what happens when a hidden `<Activity>` tears the
 * effects down and shows the tool again with its DOM intact (`reactActivityMode`).
 *
 * The element is measured once before the browser paints, since an observer only reports after
 * the first paint: a layout derived from the size (the query tab's split, which mounts with every
 * tab) would otherwise paint its fallback for a frame and then jump. Returns `null` until the
 * element has been measured.
 */
export function useContentSize(element: HTMLElement | null): ContentSize | null {
  const [size, setSize] = useState<ContentSize | null>(null)

  useLayoutEffect(() => {
    if (!element) return undefined

    const update = ({width, height}: ContentSize) =>
      setSize((current) =>
        current && current.width === width && current.height === height ? current : {width, height},
      )
    // An element without a box (under `display: none`) is left to the observer
    if (element.getClientRects().length > 0) update(measureContentBox(element))
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1)
      if (entry) update(entry.contentRect)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return size
}
