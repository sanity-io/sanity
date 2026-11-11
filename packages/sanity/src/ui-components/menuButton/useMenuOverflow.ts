import {useCallback} from 'react'

/** Set on the scroller while its content is taller than it is. */
export const MENU_OVERFLOWING_ATTRIBUTE = 'data-overflowing'

/**
 * Marks a menu's scroll container with `data-overflowing` while its content overflows, so styles
 * can react to the studio's standard scrollbar taking up room. Pass the returned ref to the
 * scroller, and give it the `menuOverflowScroller` class: that drops the rows' right padding
 * while the scrollbar shows, so rows run up to its track and the thumb is the list's right edge.
 *
 * The attribute is set on the node directly, not through state, so toggling it never re-renders
 * the menu. The scroller and each of its children are observed, so the attribute follows the
 * list growing or shrinking (a filter, a title change) and the menu being resized.
 */
export function useMenuOverflow<T extends HTMLElement = HTMLDivElement>(): (
  element: T | null,
) => (() => void) | void {
  return useCallback((element: T | null) => {
    if (!element) return undefined

    const update = () => {
      if (element.scrollHeight > element.clientHeight) {
        element.setAttribute(MENU_OVERFLOWING_ATTRIBUTE, '')
      } else {
        element.removeAttribute(MENU_OVERFLOWING_ATTRIBUTE)
      }
    }

    const resizeObserver = new ResizeObserver(update)
    const observeChildren = () => {
      resizeObserver.disconnect()
      resizeObserver.observe(element)
      for (const child of Array.from(element.children)) resizeObserver.observe(child)
    }

    const mutationObserver = new MutationObserver(() => {
      observeChildren()
      update()
    })

    observeChildren()
    mutationObserver.observe(element, {childList: true})
    update()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      element.removeAttribute(MENU_OVERFLOWING_ATTRIBUTE)
    }
  }, [])
}
