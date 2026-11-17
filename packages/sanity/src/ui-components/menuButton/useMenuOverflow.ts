import {useCallback} from 'react'

/** Set on the scroller while its content is taller than it is. */
const MENU_OVERFLOWING_ATTRIBUTE = 'data-overflowing'

/** The width the scroller's scrollbar takes from its contents, 0px for an overlay scrollbar. */
const MENU_SCROLLBAR_WIDTH_PROPERTY = '--menu-scrollbar-width'

/**
 * Marks a menu's scroll container with `data-overflowing` while its content overflows, so styles
 * can react to the studio's standard scrollbar taking up room. Pass the returned ref to the
 * scroller, and give it the `menuOverflowScroller` class: that drops the rows' right padding
 * while the scrollbar shows, so rows run up to its track and the thumb is the list's right edge.
 * The width the scrollbar takes is measured into `--menu-scrollbar-width`, so the rows move only
 * as far as a real track needs (none for an overlay scrollbar), and never by more than the inset.
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
        const style = getComputedStyle(element)
        const scrollbarWidth =
          element.offsetWidth -
          element.clientWidth -
          (parseFloat(style.borderLeftWidth) || 0) -
          (parseFloat(style.borderRightWidth) || 0)
        element.style.setProperty(MENU_SCROLLBAR_WIDTH_PROPERTY, `${Math.max(0, scrollbarWidth)}px`)
        element.setAttribute(MENU_OVERFLOWING_ATTRIBUTE, '')
      } else {
        element.style.removeProperty(MENU_SCROLLBAR_WIDTH_PROPERTY)
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
      element.style.removeProperty(MENU_SCROLLBAR_WIDTH_PROPERTY)
    }
  }, [])
}
