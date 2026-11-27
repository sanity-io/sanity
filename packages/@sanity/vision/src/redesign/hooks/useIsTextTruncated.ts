import {useLayoutEffect, useState} from 'react'

/** The innermost element of `<Text textOverflow="ellipsis">`: the span that clips the text */
function findClippingElement(text: HTMLElement): Element {
  let element: Element = text
  while (element.firstElementChild) element = element.firstElementChild
  return element
}

/**
 * Whether a `@sanity/ui` `<Text textOverflow="ellipsis">` with plain text content cuts it off.
 * The ellipsis is drawn by the innermost span `Text` renders, so that span is what overflows. It
 * is measured again whenever it resizes and whenever its text changes, as a longer title in a tab
 * of the same width truncates without resizing anything.
 */
export function useIsTextTruncated(text: HTMLElement | null): boolean {
  const [truncated, setTruncated] = useState(false)

  useLayoutEffect(() => {
    if (!text) return undefined
    const clip = findClippingElement(text)
    const measure = () => setTruncated(clip.scrollWidth > clip.clientWidth)
    measure()
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    resizeObserver?.observe(clip)
    const mutationObserver = new MutationObserver(measure)
    mutationObserver.observe(clip, {characterData: true, childList: true, subtree: true})
    return () => {
      resizeObserver?.disconnect()
      mutationObserver.disconnect()
    }
  }, [text])

  return text ? truncated : false
}
