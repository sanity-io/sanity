import {useCallback} from 'react'

/** Set on the scroller while its content is taller than it is. */
const MENU_OVERFLOWING_ATTRIBUTE = 'data-overflowing'

/** The width the scroller's scrollbar takes from its contents, 0px for an overlay scrollbar. */
const MENU_SCROLLBAR_WIDTH_PROPERTY = '--menu-scrollbar-width'

/** The list's height, set to whole rows and half the next one; read by `menuOverflowScroller`. */
const MENU_LIST_MAX_HEIGHT_PROPERTY = '--menu-list-max-height'

/** Set on the scroller while rows are hidden above its top edge: `menuOverflowScroller` fades it. */
const MENU_SCROLL_UP_ATTRIBUTE = 'data-scroll-up'

/** Set on the scroller while rows are hidden below its bottom edge: `menuOverflowScroller` fades it. */
const MENU_SCROLL_DOWN_ATTRIBUTE = 'data-scroll-down'

/**
 * The heights of the groups pinned to the top and bottom of the list, so the fades sit inside the
 * rows that scroll and never over a pinned group; read by `menuOverflowScroller`.
 */
const MENU_PINNED_TOP_PROPERTY = '--menu-pinned-top'
const MENU_PINNED_BOTTOM_PROPERTY = '--menu-pinned-bottom'

/**
 * How much of the next row a list that scrolls shows below its last whole row: half of it, so the
 * list never ends on a row edge and looks complete when it is not.
 */
const PEEK_FRACTION = 0.5

/**
 * The most a menu list grows to, in px, wherever the menu opens: it holds as many whole rows as
 * fit in this height, and when it scrolls, half the next row as well. Groups pinned to the list's
 * ends, and the search field, come on top.
 */
export const MENU_LIST_MAX_HEIGHT = 400

/** The space a popover keeps from the viewport edge it grows towards. */
const VIEWPORT_CLEARANCE = 16

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

/** A row of the list: the unit the list's height is counted in. */
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
  scroller.style.setProperty(MENU_PINNED_TOP_PROPERTY, `${top}px`)
  scroller.style.setProperty(MENU_PINNED_BOTTOM_PROPERTY, `${bottom}px`)
}

/**
 * Marks the scroller with `data-scroll-up` while rows are hidden above its top edge and with
 * `data-scroll-down` while rows are hidden below its bottom edge, for the fades.
 */
function updateScrollEdges(scroller: HTMLElement) {
  const hiddenAbove = scroller.scrollTop > 0.5
  const hiddenBelow = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 0.5
  scroller.toggleAttribute(MENU_SCROLL_UP_ATTRIBUTE, hiddenAbove)
  scroller.toggleAttribute(MENU_SCROLL_DOWN_ATTRIBUTE, hiddenBelow)
}

/** The rows of the list that scroll, in order: not those of a pinned group. */
function scrollingRows(scroller: HTMLElement, groups: HTMLElement[]): HTMLElement[] {
  return Array.from(scroller.querySelectorAll<HTMLElement>(ROW_SELECTOR)).filter(
    (row) => !groups.some((group) => group.contains(row)),
  )
}

/** Layout pixels per screen pixel: below 1 while the popover scales in as it opens. */
function scaleOf(element: HTMLElement): number {
  return element.offsetHeight > 0
    ? element.getBoundingClientRect().height / element.offsetHeight || 1
    : 1
}

/**
 * An element's top in layout pixels, from the offsets of its positioned ancestors. Unlike a screen
 * position, it ignores transforms (the popover scales as it opens and as it changes size) and
 * scrolling, so measurements made mid-animation agree with those made after it.
 */
function layoutTop(element: HTMLElement): number {
  let top = 0
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.offsetParent as HTMLElement | null
  ) {
    top += node.offsetTop + (node === element ? 0 : node.clientTop)
  }
  return top
}

/** An element's top within the scroller's content, which `scrollTop` counts in. */
function contentTop(scroller: HTMLElement, element: HTMLElement): number {
  return layoutTop(element) - layoutTop(scroller) - scroller.clientTop
}

/**
 * The most the list may be tall: `MENU_LIST_MAX_HEIGHT` of rows plus any pinned groups, and near
 * the viewport edge the popover grows towards, less, so the popover keeps `VIEWPORT_CLEARANCE`
 * from that edge (the edge below for a popover under its trigger, above for one that flipped
 * over it).
 */
function heightLimit(scroller: HTMLElement, groups: HTMLElement[]): number {
  const pinned = groups.reduce((sum, group) => sum + group.offsetHeight, 0)
  let limit = MENU_LIST_MAX_HEIGHT + pinned
  // The popover root carries its placement; its `data-ui` names the component that opened it
  const popover = scroller.closest<HTMLElement>('[data-placement]')
  // Positions on screen are only exact once the popover has finished scaling in; until then the
  // cap alone applies, and the height is fitted again when the opening settles
  if (!popover || Math.abs(scaleOf(popover) - 1) >= 0.005) return limit

  // The popover scales from the edge at its trigger, so that edge's screen position holds
  const box = popover.getBoundingClientRect()
  // The rest of the popover: the search field, a footer, the popover's own padding
  const above = layoutTop(scroller) - layoutTop(popover)
  const below =
    layoutTop(popover) + popover.offsetHeight - layoutTop(scroller) - scroller.offsetHeight
  const besidesList = above + Math.max(0, below)
  const room = popover.dataset.placement?.startsWith('top')
    ? box.bottom - VIEWPORT_CLEARANCE
    : window.innerHeight - VIEWPORT_CLEARANCE - box.top
  limit = Math.min(limit, room - besidesList)
  // A popover that constrains its size (`constrainSize`) can be held shorter still, by the
  // boundary it opens in; the list then fits that, rather than being squeezed mid-row
  const popoverMaxHeight = parseFloat(getComputedStyle(popover).maxHeight)
  if (Number.isFinite(popoverMaxHeight)) limit = Math.min(limit, popoverMaxHeight - besidesList)
  return limit
}

/**
 * Sets the list's height and, when the menu opens, where it is scrolled, so a list that scrolls
 * shows that it does: it ends half way through a row, never on a row edge that would make it look
 * complete.
 *
 * The list shows a run of whole rows: it starts with the space the list keeps clear at its top
 * (4px, plus a pinned header), then rows. If more rows follow the run, the top half of the next
 * one shows below it, then any pinned footer (no 4px gap: the half row runs up to the footer or
 * the list's edge). If the run reaches the last row, the space the list keeps clear at its bottom
 * follows it (4px, plus a pinned footer, or whatever follows the last row). As many rows as fit
 * `heightLimit`, with the half row: a row less when the half row would not fit otherwise. A list
 * whose rows all fit keeps its natural height.
 *
 * When the menu opens (`toSelection`), the run starts at the top. If a row is selected and does
 * not fit in that run, the run starts at the first row that lets it hold the selected row whole,
 * and the list is scrolled there: the top visible row starts 8px below the search field and the
 * selected row is whole, never the half row, also when it is the last one. Otherwise the run
 * starts at the top visible row, so a list that changes size while open (a filter) keeps its
 * scroll.
 *
 * Rows of different heights in one list (a section heading between them) make the height differ
 * from run to run, so the height is fitted to the run that shows.
 */
function fitRows(scroller: HTMLElement, groups: HTMLElement[], toSelection: boolean) {
  const rows = scrollingRows(scroller, groups)
  const setHeight = (value: string) => {
    if (scroller.style.getPropertyValue(MENU_LIST_MAX_HEIGHT_PROPERTY) === value) return
    if (value) scroller.style.setProperty(MENU_LIST_MAX_HEIGHT_PROPERTY, value)
    else scroller.style.removeProperty(MENU_LIST_MAX_HEIGHT_PROPERTY)
  }
  if (rows.length === 0) {
    setHeight('')
    if (toSelection) scroller.scrollTop = 0
    return
  }

  const style = getComputedStyle(scroller)
  const clearTop = parseFloat(style.scrollPaddingTop) || 0
  const clearBottom = parseFloat(style.scrollPaddingBottom) || 0
  const tops = rows.map((row) => contentTop(scroller, row))
  const bottoms = rows.map((row, index) => tops[index] + row.offsetHeight)
  const last = rows.length - 1
  // What follows the last row: the list's own padding, a pinned footer
  const end = scroller.scrollHeight - bottoms[last]
  let limit = heightLimit(scroller, groups)
  // Whatever holds the list can cap it too (a menu with a max-height of its own). Measured without
  // the height set here, as the list would be without it, so a list held short is fitted to that
  const fitted = scroller.style.getPropertyValue(MENU_LIST_MAX_HEIGHT_PROPERTY)
  const scrollTop = scroller.scrollTop
  if (fitted) scroller.style.removeProperty(MENU_LIST_MAX_HEIGHT_PROPERTY)
  if (scroller.scrollHeight > scroller.clientHeight + 0.5) {
    limit = Math.min(limit, scroller.offsetHeight)
  }
  if (fitted) {
    scroller.style.setProperty(MENU_LIST_MAX_HEIGHT_PROPERTY, fitted)
    // Taller for a moment, the list may have lost its scroll
    scroller.scrollTop = scrollTop
  }

  /** Where the list is scrolled to for a run starting at row `m`. */
  const startOf = (m: number) => (m === 0 ? 0 : tops[m] - clearTop)
  // A pinned footer: the space kept clear at the bottom, less the 4px gap
  const pinnedBottom = Math.max(0, clearBottom - LIST_EDGE_GAP)
  /**
   * The list's height for whole rows `m` to `k`: with the space kept clear after the last row, or
   * before any other row, the top half of row `k + 1` and the pinned footer.
   */
  const heightOf = (m: number, k: number) =>
    k === last
      ? bottoms[k] - startOf(m) + end
      : tops[k + 1] + rows[k + 1].offsetHeight * PEEK_FRACTION - startOf(m) + pinnedBottom
  /** The last whole row of the longest run from row `m` that fits; at least row `m` itself. */
  const runEnd = (m: number) => {
    let k = m
    while (k < last && heightOf(m, k + 1) <= limit + 0.5) k += 1
    return k
  }

  let m = 0
  if (toSelection) {
    const selected = selectedRow(scroller)
    const j = selected ? rows.indexOf(selected) : -1
    if (j > 0) while (m < j && runEnd(m) < j) m += 1
  } else {
    const found = tops.findIndex(
      (top, index) => index > 0 && top - clearTop >= scroller.scrollTop - 0.5,
    )
    m = scroller.scrollTop <= 0.5 || found === -1 ? 0 : found
  }

  const k = runEnd(m)
  setHeight(m === 0 && k === last ? '' : `${Math.round(heightOf(m, k) * 100) / 100}px`)
  if (toSelection) scroller.scrollTop = startOf(m)
}

/**
 * For the scroll container of a menu list. Pass the returned ref to the scroller, and give it the
 * `menuOverflowScroller` class.
 *
 * - Marks the scroller with `data-overflowing` while its content overflows, so styles can react
 *   to the studio's standard scrollbar taking up room: the class trims the rows' right padding
 *   while the scrollbar shows, so rows end 4px before its track, 8px before the thumb that is
 *   the list's right edge. The width the scrollbar takes is measured into `--menu-scrollbar-width`, so the rows
 *   move only as far as a real track needs (none for an overlay scrollbar), and never by more
 *   than the inset.
 * - Keeps the scroller's `scroll-padding` at the space the list keeps clear at each end, so a row
 *   scrolled into view is never hidden under the search field or a pinned group.
 * - Keeps a list that scrolls whole rows plus half the next one tall, up to `MENU_LIST_MAX_HEIGHT`
 *   and clear of the viewport edge, so the half row shows there is more; a list that fits keeps
 *   its natural height. Every time the menu opens, scrolls it to the top, or to the selected row,
 *   which shows whole (see `fitRows`). A closed menu stays mounted, so without this the list
 *   would reopen wherever it was left, possibly with a row cut in half under the search field.
 * - Marks the scroller with `data-scroll-up` / `data-scroll-down` while rows are hidden beyond its
 *   top / bottom edge, updated as it scrolls, and measures the pinned groups into
 *   `--menu-pinned-top` / `--menu-pinned-bottom`: the class fades that edge, inside the rows that
 *   scroll and clear of the pinned groups.
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
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    /** Until when, after the menu opens, its own focus handling may still scroll the list. */
    let openingUntil = 0

    /** Fits the list's height and, while the menu is opening, scrolls it to the selection. */
    const settle = () => {
      fitRows(element, stickyGroups(element), performance.now() < openingUntil)
      updateScrollEdges(element)
    }

    const settleNextFrame = () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = undefined
        settle()
      })
    }

    // The menu focuses its active row (the selected one) a frame or two after it opens, and the
    // browser scrolls a focused row it judges out of view to the middle of the list, cutting the
    // top row in half. While the menu is opening, put the list back once that focus lands.
    const handleFocusIn = () => {
      if (performance.now() < openingUntil) settleNextFrame()
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
      if (!shown) return

      if (!wasShown) {
        openingUntil = performance.now() + OPENING_DURATION
        fitRows(element, groups, true)
        // Once more after the popover has settled its size, which can still change in the
        // frame it opens in, and once its opening animation is over, when its position on screen
        // is final and the room to the viewport edge can be measured
        settleNextFrame()
        if (settleTimer !== undefined) clearTimeout(settleTimer)
        settleTimer = setTimeout(() => {
          settleTimer = undefined
          settle()
        }, OPENING_DURATION / 2)
      } else {
        // In the next frame: a change of height (often the one set here) moves the popover a
        // frame later, and until then its position on screen, and so the room to the viewport
        // edge, is stale; for a popover that opened above its trigger, by the whole change
        settleNextFrame()
      }
      updateScrollEdges(element)
    }

    const handleScroll = () => updateScrollEdges(element)

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
    element.addEventListener('scroll', handleScroll, {passive: true})
    element.addEventListener('keydown', endOpening)
    element.addEventListener('pointerdown', endOpening)
    element.addEventListener('wheel', endOpening, {passive: true})
    element.addEventListener('touchstart', endOpening, {passive: true})
    update()

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      if (settleTimer !== undefined) clearTimeout(settleTimer)
      element.removeEventListener('focusin', handleFocusIn)
      element.removeEventListener('scroll', handleScroll)
      element.removeEventListener('keydown', endOpening)
      element.removeEventListener('pointerdown', endOpening)
      element.removeEventListener('wheel', endOpening)
      element.removeEventListener('touchstart', endOpening)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      element.removeAttribute(MENU_OVERFLOWING_ATTRIBUTE)
      element.removeAttribute(MENU_SCROLL_UP_ATTRIBUTE)
      element.removeAttribute(MENU_SCROLL_DOWN_ATTRIBUTE)
      element.style.removeProperty(MENU_SCROLLBAR_WIDTH_PROPERTY)
      element.style.removeProperty(MENU_PINNED_TOP_PROPERTY)
      element.style.removeProperty(MENU_PINNED_BOTTOM_PROPERTY)
      element.style.removeProperty('scroll-padding-top')
      element.style.removeProperty('scroll-padding-bottom')
      element.style.removeProperty(MENU_LIST_MAX_HEIGHT_PROPERTY)
    }
  }, [])
}
