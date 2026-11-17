import {useCallback} from 'react'

/** Set on the scroller while its content is taller than it is. */
const MENU_OVERFLOWING_ATTRIBUTE = 'data-overflowing'

/** The width the scroller's scrollbar takes from its contents, 0px for an overlay scrollbar. */
const MENU_SCROLLBAR_WIDTH_PROPERTY = '--menu-scrollbar-width'

/**
 * The space a menu list keeps between its edge and its rows. The search field above the list
 * keeps another 4px below itself, so a row scrolled to the list's top edge sits 8px below the
 * field, as the first row does before anything scrolls.
 */
const LIST_EDGE_GAP = 4

/**
 * The row the menu marks as the current choice: a checked radio row, or else a row rendered with
 * `selected` (`data-selected`). A `pressed` button row carries no attribute of its own.
 */
function selectedRow(scroller: HTMLElement): HTMLElement | null {
  return (
    scroller.querySelector<HTMLElement>('[aria-checked="true"]') ??
    scroller.querySelector<HTMLElement>('[data-ui="MenuItem"][data-selected]')
  )
}

/** How long after the menu opens its own focus handling is put right (see `handleFocusIn`). */
const OPENING_DURATION = 500

/** A row of the list, for lining the top visible row up with the list's edge. */
const ROW_SELECTOR = '[data-ui="MenuItem"]'

function isSticky(element: Element): boolean {
  return getComputedStyle(element).position === 'sticky'
}

/**
 * The groups pinned to the top and bottom of the list while it scrolls (the perspective menu's
 * Published and Drafts, and its footer): they sit directly in the list or one level down.
 */
function stickyGroups(scroller: HTMLElement): HTMLElement[] {
  const groups: HTMLElement[] = []
  for (const child of Array.from(scroller.children)) {
    if (isSticky(child)) groups.push(child as HTMLElement)
    for (const grandchild of Array.from(child.children)) {
      if (isSticky(grandchild)) groups.push(grandchild as HTMLElement)
    }
  }
  return groups
}

/**
 * Sets the scroller's `scroll-padding` to the space the list keeps clear at each end: the 4px
 * edge gap, plus a group pinned to that end. Everything that scrolls a row into view (the
 * browser's own scrolling for keyboard focus, `scrollIntoView({block: 'nearest'})`, and the
 * open handling below) then stops the row short of the pinned group and the search field.
 */
function updateScrollPadding(scroller: HTMLElement, groups: HTMLElement[]) {
  let top = 0
  let bottom = 0
  for (const group of groups) {
    const style = getComputedStyle(group)
    if (style.top !== 'auto') top = Math.max(top, group.offsetHeight)
    if (style.bottom !== 'auto') bottom = Math.max(bottom, group.offsetHeight)
  }
  scroller.style.scrollPaddingTop = `${top + LIST_EDGE_GAP}px`
  scroller.style.scrollPaddingBottom = `${bottom + LIST_EDGE_GAP}px`
}

/**
 * Where the list is scrolled when the menu opens. A closed menu stays mounted, so without this
 * the list would reopen wherever it was left, possibly with a row cut in half under the search
 * field. Instead the list starts at the top, and when a row is selected and does not fit there,
 * scrolls just far enough to show it whole above the bottom edge. The scroll then rounds up to the
 * next row, so the top visible row starts at the list's edge, 8px below the search field, rather
 * than being cut in half.
 *
 * Near the end of the list there may be no such row to round to, because the list cannot scroll
 * past its end. The selected row is still shown whole, but the top visible row can then be cut.
 */
function scrollToSelection(scroller: HTMLElement, groups: HTMLElement[]) {
  scroller.scrollTop = 0
  const selected = selectedRow(scroller)
  if (!selected || groups.some((group) => group.contains(selected))) return

  const style = getComputedStyle(scroller)
  const paddingTop = parseFloat(style.scrollPaddingTop) || 0
  const paddingBottom = parseFloat(style.scrollPaddingBottom) || 0
  // The popover scales in while it opens, so screen positions are divided by that scale to get
  // layout pixels, the unit of `scrollTop`
  const box = scroller.getBoundingClientRect()
  const scale = scroller.offsetHeight > 0 ? box.height / scroller.offsetHeight || 1 : 1
  const origin = box.top + scroller.clientTop * scale
  const offsetOf = (element: Element) => (element.getBoundingClientRect().top - origin) / scale
  const view = scroller.clientHeight
  const rowTop = offsetOf(selected)
  const rowBottom = rowTop + selected.offsetHeight

  if (rowBottom <= view - paddingBottom) return

  const nearest = rowBottom + paddingBottom - view
  const latest = Math.min(rowTop - paddingTop, scroller.scrollHeight - view)
  const rowStarts = Array.from(scroller.querySelectorAll(ROW_SELECTOR))
    .filter((row) => !groups.some((group) => group.contains(row)))
    .map((row) => offsetOf(row) - paddingTop)
    .filter((start) => start >= nearest - 0.5 && start <= latest + 0.5)

  scroller.scrollTop = rowStarts.length > 0 ? Math.min(...rowStarts) : nearest
}

/**
 * For the scroll container of a menu list. Pass the returned ref to the scroller, and give it the
 * `menuOverflowScroller` class.
 *
 * - Marks the scroller with `data-overflowing` while its content overflows, so styles can react
 *   to the studio's standard scrollbar taking up room: the class drops the rows' right padding
 *   while the scrollbar shows, so rows run up to its track and the thumb is the list's right
 *   edge. The width the scrollbar takes is measured into `--menu-scrollbar-width`, so the rows
 *   move only as far as a real track needs (none for an overlay scrollbar), and never by more
 *   than the inset.
 * - Keeps the scroller's `scroll-padding` at the space the list keeps clear at each end, so a row
 *   scrolled into view is never hidden under the search field or a pinned group.
 * - Every time the menu opens, scrolls the list to the top, or to the selected row (see
 *   `scrollToSelection`).
 *
 * The attribute and styles are set on the node directly, not through state, so they never
 * re-render the menu. The scroller and each of its children are observed, so they follow the
 * list growing or shrinking (a filter, a title change) and the menu being resized. A closed menu
 * stays mounted and hidden; it opens when the scroller gets a box again.
 */
export function useMenuOverflow<T extends HTMLElement = HTMLDivElement>(): (
  element: T | null,
) => (() => void) | void {
  return useCallback((element: T | null) => {
    if (!element) return undefined

    let shown = false
    let frame: number | undefined
    /** Until when, after the menu opens, its own focus handling may still scroll the list. */
    let openingUntil = 0

    const scrollToSelectionNextFrame = () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = undefined
        scrollToSelection(element, stickyGroups(element))
      })
    }

    // The menu focuses its active row (the selected one) a frame or two after it opens, and the
    // browser scrolls a focused row it judges out of view to the middle of the list, cutting the
    // top row in half. While the menu is opening, put the list back once that focus lands.
    const handleFocusIn = () => {
      if (performance.now() < openingUntil) scrollToSelectionNextFrame()
    }
    // Any key or pointer use of the list ends the opening: from then on, scrolling is the user's
    const endOpening = () => {
      openingUntil = 0
    }

    const update = () => {
      const groups = stickyGroups(element)
      updateScrollPadding(element, groups)

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

      const wasShown = shown
      shown = element.getClientRects().length > 0
      if (shown && !wasShown) {
        openingUntil = performance.now() + OPENING_DURATION
        scrollToSelection(element, groups)
        // Once more after the popover has settled its size, which can still change in the
        // frame it opens in
        scrollToSelectionNextFrame()
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
    element.addEventListener('focusin', handleFocusIn)
    element.addEventListener('keydown', endOpening)
    element.addEventListener('pointerdown', endOpening)
    element.addEventListener('wheel', endOpening, {passive: true})
    element.addEventListener('touchstart', endOpening, {passive: true})
    update()

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      element.removeEventListener('focusin', handleFocusIn)
      element.removeEventListener('keydown', endOpening)
      element.removeEventListener('pointerdown', endOpening)
      element.removeEventListener('wheel', endOpening)
      element.removeEventListener('touchstart', endOpening)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      element.removeAttribute(MENU_OVERFLOWING_ATTRIBUTE)
      element.style.removeProperty(MENU_SCROLLBAR_WIDTH_PROPERTY)
      element.style.removeProperty('scroll-padding-top')
      element.style.removeProperty('scroll-padding-bottom')
    }
  }, [])
}
