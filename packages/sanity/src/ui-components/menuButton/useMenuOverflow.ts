import {useCallback, useRef} from 'react'

/** Set on the scroller while rows are hidden above its top edge: `menuOverflowScroller` fades it. */
const SCROLL_UP_ATTRIBUTE = 'data-scroll-up'

/** Set on the scroller while rows are hidden below its bottom edge: `menuOverflowScroller` fades it. */
const SCROLL_DOWN_ATTRIBUTE = 'data-scroll-down'

/** How many frames `onOpen` waits for the menu to be shown before giving up. */
const MAX_WAIT_FRAMES = 10

/**
 * The row the menu marks as the current choice: a checked radio row, or else a row rendered with
 * `selected` (`data-selected`).
 */
function selectedRow(scroller: HTMLElement): HTMLElement | null {
  return (
    scroller.querySelector<HTMLElement>('[aria-checked="true"]') ??
    scroller.querySelector<HTMLElement>('[data-ui="MenuItem"][data-selected]')
  )
}

function updateScrollEdges(scroller: HTMLElement) {
  const hiddenAbove = scroller.scrollTop > 0.5
  const hiddenBelow = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 0.5
  scroller.toggleAttribute(SCROLL_UP_ATTRIBUTE, hiddenAbove)
  scroller.toggleAttribute(SCROLL_DOWN_ATTRIBUTE, hiddenBelow)
}

/**
 * For the scroll container of a menu list styled with `menuOverflowScroller`, which does the
 * sizing and the fades. Pass `scrollerRef` to the scroller and `onOpen` to the `MenuButton`.
 *
 * - Marks the scroller with `data-scroll-up` / `data-scroll-down` while rows are hidden beyond its
 *   top / bottom edge, so the class fades that edge. Updated as it scrolls and as its contents
 *   change size (a filter). Only attributes are written, never sizes, so the observer does not
 *   feed back into itself.
 * - When the menu opens, scrolls the list to the top, then brings the selected row into view.
 *   A closed menu stays mounted, so without this it would reopen wherever it was left.
 */
export function useMenuOverflow<T extends HTMLElement = HTMLDivElement>(): {
  scrollerRef: (element: T | null) => (() => void) | void
  onOpen: () => void
} {
  const elementRef = useRef<T | null>(null)
  const frameRef = useRef<number | undefined>(undefined)

  const scrollerRef = useCallback((element: T | null) => {
    if (!element) return undefined
    elementRef.current = element

    const update = () => updateScrollEdges(element)
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(element)
    for (const child of Array.from(element.children)) resizeObserver.observe(child)
    element.addEventListener('scroll', update, {passive: true})
    update()

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
      frameRef.current = undefined
      elementRef.current = null
      resizeObserver.disconnect()
      element.removeEventListener('scroll', update)
      element.removeAttribute(SCROLL_UP_ATTRIBUTE)
      element.removeAttribute(SCROLL_DOWN_ATTRIBUTE)
    }
  }, [])

  const onOpen = useCallback(() => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    let frames = 0
    // The open callback runs before the popover is shown, so wait for a frame where the list has a box
    const scroll = () => {
      frameRef.current = undefined
      const element = elementRef.current
      if (!element) return
      if (element.getClientRects().length === 0) {
        if (frames < MAX_WAIT_FRAMES) {
          frames += 1
          frameRef.current = requestAnimationFrame(scroll)
        }
        return
      }
      element.scrollTop = 0
      selectedRow(element)?.scrollIntoView({block: 'nearest', inline: 'nearest'})
      updateScrollEdges(element)
    }
    frameRef.current = requestAnimationFrame(scroll)
  }, [])

  return {scrollerRef, onOpen}
}
