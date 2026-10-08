interface Rect {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

/**
 * What `IntersectionObserver.isIntersecting` would be for `target` under `options`, computed
 * synchronously from the current layout.
 *
 * An `IntersectionObserver` delivers its first entries in a task after the frame that first lays
 * the target out, so a component that renders nothing until an entry has arrived paints a frame
 * without it. `ObserveElement` reports this value from a layout effect, before that first paint,
 * and leaves the observer to report later changes.
 *
 * Mirrors the observer: the root bounds are the root (its padding box when it clips its overflow,
 * its border box otherwise; the viewport when there is no root) expanded by `rootMargin`, the
 * ratio is the share of the target's area inside those bounds, and the target is intersecting
 * when that ratio reaches the smallest threshold. Rects that only touch count as intersecting at
 * threshold 0, like they do for the observer. Clipping by scroll containers between the target
 * and the root is not accounted for; the collapse menus observe children of the row they use as
 * root, which is the only element clipping them.
 */
export function measureIntersection(
  target: Element,
  options: IntersectionObserverInit = {},
): boolean {
  const targetRect = target.getBoundingClientRect()
  const rootRect = expand(getRootRect(options.root), parseRootMargin(options.rootMargin))

  const width =
    Math.min(targetRect.right, rootRect.right) - Math.max(targetRect.left, rootRect.left)
  const height =
    Math.min(targetRect.bottom, rootRect.bottom) - Math.max(targetRect.top, rootRect.top)
  if (width < 0 || height < 0) return false

  const targetArea = targetRect.width * targetRect.height
  // A target without area either intersects or does not; there is no ratio in between
  const ratio = targetArea === 0 ? 1 : (width * height) / targetArea
  return ratio >= minThreshold(options.threshold)
}

/**
 * Whether an observer entry reaches the smallest threshold in `options`: the test
 * `measureIntersection` applies, so an entry the observer delivers later cannot disagree with the
 * measurement reported at mount. Browsers differ in whether `isIntersecting` already means this
 * or any overlap at all (what the specification says), so the entry is not taken at its word.
 */
export function reachesThreshold(
  entry: Pick<IntersectionObserverEntry, 'isIntersecting' | 'intersectionRatio'>,
  options: IntersectionObserverInit = {},
): boolean {
  return entry.isIntersecting && entry.intersectionRatio >= minThreshold(options.threshold)
}

function getRootRect(root: IntersectionObserverInit['root']): Rect {
  if (root instanceof Element) {
    const rect = root.getBoundingClientRect()
    if (!clipsOverflow(root)) {
      // A root that does not clip is measured by its border box
      return rect
    }
    // One that does is measured by the area it clips to: its padding box, without borders and
    // scrollbars
    const left = rect.left + root.clientLeft
    const top = rect.top + root.clientTop
    const {clientWidth, clientHeight} = root
    return {
      left,
      top,
      right: left + clientWidth,
      bottom: top + clientHeight,
      width: clientWidth,
      height: clientHeight,
    }
  }
  const width = document.documentElement.clientWidth
  const height = document.documentElement.clientHeight
  return {top: 0, right: width, bottom: height, left: 0, width, height}
}

function clipsOverflow(element: Element): boolean {
  const {overflow, overflowX, overflowY} = getComputedStyle(element)
  // Any axis that is not `visible` clips. jsdom leaves what it does not compute empty, and
  // does not expand the shorthand into its longhands, hence all three
  return [overflow, overflowX, overflowY].some((value) => value !== '' && value !== 'visible')
}

function minThreshold(threshold: IntersectionObserverInit['threshold']): number {
  if (threshold === undefined) return 0
  if (typeof threshold === 'number') return threshold
  return threshold.length === 0 ? 0 : Math.min(...threshold)
}

/**
 * `rootMargin` follows the CSS `margin` shorthand: one to four lengths in `px` or `%`, applied
 * top, right, bottom, left, with percentages relative to the root's size on that axis.
 */
function parseRootMargin(rootMargin: string | undefined): [string, string, string, string] {
  const parts = (rootMargin || '0px').trim().split(/\s+/)
  const [top, right = top, bottom = top, left = right] = parts
  return [top, right, bottom, left]
}

function toPixels(length: string, basis: number): number {
  const value = parseFloat(length)
  if (Number.isNaN(value)) return 0
  return length.trim().endsWith('%') ? (value / 100) * basis : value
}

function expand(rect: Rect, [top, right, bottom, left]: [string, string, string, string]): Rect {
  const expanded = {
    top: rect.top - toPixels(top, rect.height),
    right: rect.right + toPixels(right, rect.width),
    bottom: rect.bottom + toPixels(bottom, rect.height),
    left: rect.left - toPixels(left, rect.width),
  }
  return {
    ...expanded,
    width: expanded.right - expanded.left,
    height: expanded.bottom - expanded.top,
  }
}
