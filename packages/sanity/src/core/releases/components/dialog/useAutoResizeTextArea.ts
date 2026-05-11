import {type RefObject, useLayoutEffect} from 'react'

export function useAutoResizeTextArea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string | undefined,
  maxHeight?: number,
): void {
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    element.style.overflow = 'hidden'
    element.style.height = 'auto'
    const measuredHeight = element.scrollHeight
    const exceedsMax = typeof maxHeight === 'number' && measuredHeight > maxHeight

    element.style.height = `${exceedsMax ? maxHeight : measuredHeight}px`
    if (exceedsMax) {
      element.style.overflow = 'auto'
    }
  }, [ref, value, maxHeight])
}
