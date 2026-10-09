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
    return getPaddingBox(root, rect)
  }
  const width = document.documentElement.clientWidth
  const height = document.documentElement.clientHeight
  return {top: 0, right: width, bottom: height, left: 0, width, height}
}

/**
 * The area a clipping root clips to: its padding box, without borders and scrollbars. Taken from
 * the bounding rect and the computed border widths, which keep the subpixel precision the observer
 * works with; the `client*` geometry is rounded to whole pixels, which would move the bounds of a
 * root with a fractional size by up to half a pixel, so it only sizes the scrollbars.
 *
 * The bounding rect is in viewport pixels while the border widths and the `client*` / `offset*`
 * geometry are in the root's own, and a transformed ancestor scales the former. The border box is
 * known in both (`offset*` is its rounded size in the root's pixels), which gives the scale per
 * axis; borders and scrollbars are sized in the root's pixels and scaled into the viewport.
 */
function getPaddingBox(root: Element, rect: DOMRect): Rect {
  const style = getComputedStyle(root)
  const borderTop = toPixels(style.borderTopWidth, 0)
  const borderRight = toPixels(style.borderRightWidth, 0)
  const borderBottom = toPixels(style.borderBottomWidth, 0)
  const borderLeft = toPixels(style.borderLeftWidth, 0)
  // Without layout (jsdom, an unrendered root) `offset*` is 0; the viewport rect is then the
  // only size there is, at scale 1
  const localWidth = (root instanceof HTMLElement && root.offsetWidth) || rect.width
  const localHeight = (root instanceof HTMLElement && root.offsetHeight) || rect.height
  const scaleX = localWidth > 0 ? rect.width / localWidth : 1
  const scaleY = localHeight > 0 ? rect.height / localHeight : 1
  // In right-to-left layouts a vertical scrollbar sits on the left, where `clientLeft` counts it
  const scrollbarLeft = scrollbarSize(root.clientLeft - borderLeft)
  const scrollbarWidth = scrollbarSize(localWidth - borderLeft - borderRight - root.clientWidth)
  const scrollbarHeight = scrollbarSize(localHeight - borderTop - borderBottom - root.clientHeight)
  const left = rect.left + (borderLeft + scrollbarLeft) * scaleX
  const top = rect.top + borderTop * scaleY
  const width = rect.width - (borderLeft + borderRight + scrollbarWidth) * scaleX
  const height = rect.height - (borderTop + borderBottom + scrollbarHeight) * scaleY
  return {left, top, right: left + width, bottom: top + height, width, height}
}

/**
 * The scrollbar in a difference between the border or padding box and the rounded `client*`
 * geometry, all in the root's own pixels. Scrollbars take whole pixels, or none when they overlay
 * the content, while rounding moves the `client*` values by half a pixel at most, so a smaller
 * difference is rounding alone.
 */
function scrollbarSize(difference: number): number {
  return difference < 1 ? 0 : Math.round(difference)
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
