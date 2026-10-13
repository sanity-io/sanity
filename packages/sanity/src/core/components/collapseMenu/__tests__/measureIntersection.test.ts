import {afterEach, describe, expect, it, vi} from 'vitest'

import {measureIntersection, reachesThreshold} from '../measureIntersection'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface Layout {
  border?: number
  overflow?: string
  /** The size of the scrollbars `client*` leaves out, on both axes */
  scrollbar?: number
  /** A CSS transform scale on an ancestor: the bounding rect is in viewport pixels, the rest in the element's own */
  scale?: number
}

/** An element whose layout is the given box, in its own pixels; jsdom lays nothing out itself */
function element(box: Box, {border = 0, overflow, scrollbar = 0, scale = 1}: Layout = {}) {
  const el = document.createElement('div')
  if (overflow) el.style.overflow = overflow
  if (border) el.style.borderWidth = `${border}px`
  el.getBoundingClientRect = () =>
    DOMRect.fromRect({
      x: box.x * scale,
      y: box.y * scale,
      width: box.width * scale,
      height: box.height * scale,
    })
  // Browsers round the `offset*` and `client*` geometry to whole pixels
  Object.defineProperties(el, {
    offsetWidth: {value: Math.round(box.width)},
    offsetHeight: {value: Math.round(box.height)},
    clientLeft: {value: Math.round(border)},
    clientTop: {value: Math.round(border)},
    clientWidth: {value: Math.round(box.width - 2 * border - scrollbar)},
    clientHeight: {value: Math.round(box.height - 2 * border - scrollbar)},
  })
  return el
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('measureIntersection', () => {
  // A 100px wide row, like the hidden measurement row of CollapseTabList
  const root = element({x: 0, y: 0, width: 100, height: 20})

  it('reports a target inside the root as intersecting at every threshold', () => {
    const target = element({x: 10, y: 0, width: 60, height: 20})

    expect(measureIntersection(target, {root, threshold: 1})).toBe(true)
    expect(measureIntersection(target, {root, threshold: 0})).toBe(true)
    expect(measureIntersection(target, {root})).toBe(true)
  })

  it('compares the visible share of the target against the smallest threshold', () => {
    // 60% of the target is inside the root
    const target = element({x: 64, y: 0, width: 60, height: 20})

    expect(measureIntersection(target, {root, threshold: 1})).toBe(false)
    expect(measureIntersection(target, {root, threshold: 0.99})).toBe(false)
    expect(measureIntersection(target, {root, threshold: 0.75})).toBe(false)
    expect(measureIntersection(target, {root, threshold: 0.5})).toBe(true)
    expect(measureIntersection(target, {root, threshold: [0.5, 1]})).toBe(true)
    expect(measureIntersection(target, {root, threshold: 0})).toBe(true)
  })

  it('reports a target outside the root as not intersecting', () => {
    const target = element({x: 120, y: 0, width: 60, height: 20})

    expect(measureIntersection(target, {root, threshold: 0})).toBe(false)
    expect(measureIntersection(target, {root, threshold: 1})).toBe(false)
  })

  it('counts rects that only touch as intersecting at threshold 0', () => {
    const target = element({x: 100, y: 0, width: 60, height: 20})

    expect(measureIntersection(target, {root, threshold: 0})).toBe(true)
    expect(measureIntersection(target, {root, threshold: 0.01})).toBe(false)
  })

  it('expands the root by rootMargin', () => {
    // Overflows the root by one pixel on the right
    const target = element({x: 41, y: 0, width: 60, height: 20})

    expect(measureIntersection(target, {root, threshold: 1})).toBe(false)
    expect(measureIntersection(target, {root, threshold: 1, rootMargin: '1px'})).toBe(true)
    // Four values apply top, right, bottom, left; the right one is what this target needs
    expect(measureIntersection(target, {root, threshold: 1, rootMargin: '0px 1px 0px 0px'})).toBe(
      true,
    )
    expect(measureIntersection(target, {root, threshold: 1, rootMargin: '0px 0px 0px 1px'})).toBe(
      false,
    )
    // Percentages are relative to the root's size on that axis: 1% of 100px
    expect(measureIntersection(target, {root, threshold: 1, rootMargin: '1%'})).toBe(true)
  })

  it('measures a root that clips its overflow by its padding box, leaving its borders out', () => {
    const clippingRoot = element(
      {x: 0, y: 0, width: 100, height: 20},
      {border: 2, overflow: 'hidden'},
    )
    // Ends on the border, outside the padding box
    const target = element({x: 40, y: 2, width: 60, height: 16})

    expect(measureIntersection(target, {root: clippingRoot, threshold: 1})).toBe(false)
    expect(measureIntersection(target, {root: clippingRoot, threshold: 1, rootMargin: '2px'})).toBe(
      true,
    )
  })

  it('keeps the subpixel size of a root that clips its overflow', () => {
    // 100.5px wide, which `clientWidth` rounds to 101
    const fractionalRoot = element({x: 0, y: 0, width: 100.5, height: 20}, {overflow: 'hidden'})
    // Ends a quarter pixel past the padding box: inside the rounded width, not the real one
    const pastTheEdge = element({x: 40.75, y: 0, width: 60, height: 20})
    const inside = element({x: 40.25, y: 0, width: 60, height: 20})

    expect(measureIntersection(pastTheEdge, {root: fractionalRoot, threshold: 1})).toBe(false)
    expect(measureIntersection(inside, {root: fractionalRoot, threshold: 1})).toBe(true)
  })

  it('leaves the scrollbars of a root that scrolls out', () => {
    const scrollingRoot = element(
      {x: 0, y: 0, width: 100, height: 40},
      {overflow: 'auto', scrollbar: 15},
    )
    // Ends under the vertical scrollbar
    const underScrollbar = element({x: 30, y: 0, width: 60, height: 20})
    const beside = element({x: 20, y: 0, width: 60, height: 20})

    expect(measureIntersection(underScrollbar, {root: scrollingRoot, threshold: 1})).toBe(false)
    expect(measureIntersection(beside, {root: scrollingRoot, threshold: 1})).toBe(true)
  })

  it('measures a clipping root under a scaled ancestor in viewport pixels, like its targets', () => {
    // A 100×20 root with 2px borders, painted at twice the size: 200×40 in the viewport, while
    // its own geometry (`client*`, `offset*`, border widths) stays in its own pixels
    const scaledRoot = element(
      {x: 0, y: 0, width: 100, height: 20},
      {border: 2, overflow: 'hidden', scale: 2},
    )
    // Targets are measured by their bounding rects, in viewport pixels
    const inside = element({x: 120, y: 4, width: 60, height: 32})
    const pastTheEdge = element({x: 150, y: 4, width: 60, height: 32})
    const onTheScaledBorder = element({x: 3, y: 4, width: 60, height: 32})

    expect(measureIntersection(inside, {root: scaledRoot, threshold: 1})).toBe(true)
    expect(measureIntersection(pastTheEdge, {root: scaledRoot, threshold: 1})).toBe(false)
    expect(measureIntersection(onTheScaledBorder, {root: scaledRoot, threshold: 1})).toBe(false)
  })

  it('measures a root that does not clip by its border box', () => {
    const openRoot = element({x: 0, y: 0, width: 100, height: 20}, {border: 2, overflow: 'visible'})
    // Ends on the border: inside the border box
    const onBorder = element({x: 40, y: 2, width: 60, height: 16})
    // Starts past the border box
    const outside = element({x: 100, y: 2, width: 60, height: 16})

    expect(measureIntersection(onBorder, {root: openRoot, threshold: 1})).toBe(true)
    expect(measureIntersection(outside, {root: openRoot, threshold: 0.01})).toBe(false)
  })

  it('treats a target without area as intersecting when it is inside the root', () => {
    expect(
      measureIntersection(element({x: 50, y: 10, width: 0, height: 0}), {root, threshold: 1}),
    ).toBe(true)
    expect(
      measureIntersection(element({x: 150, y: 10, width: 0, height: 0}), {root, threshold: 1}),
    ).toBe(false)
  })

  it('reads observer entries with the same threshold test', () => {
    // A browser that reports any overlap as intersecting, like the specification says
    const partial = {isIntersecting: true, intersectionRatio: 0.6}
    expect(reachesThreshold(partial, {root, threshold: 1})).toBe(false)
    expect(reachesThreshold(partial, {root, threshold: 0.99})).toBe(false)
    expect(reachesThreshold(partial, {root, threshold: 0.5})).toBe(true)
    expect(reachesThreshold(partial, {root, threshold: [0.5, 1]})).toBe(true)
    expect(reachesThreshold(partial, {root})).toBe(true)

    expect(reachesThreshold({isIntersecting: true, intersectionRatio: 1}, {threshold: 1})).toBe(
      true,
    )
    // Touching rects: intersecting with no area, which only threshold 0 accepts
    expect(reachesThreshold({isIntersecting: true, intersectionRatio: 0}, {threshold: 0})).toBe(
      true,
    )
    expect(reachesThreshold({isIntersecting: true, intersectionRatio: 0}, {threshold: 0.01})).toBe(
      false,
    )
    // Not intersecting at all: a ratio of 0 does not reach threshold 0 either
    expect(reachesThreshold({isIntersecting: false, intersectionRatio: 0}, {threshold: 0})).toBe(
      false,
    )
  })

  it('measures against the viewport without a root', () => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000)
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800)

    expect(
      measureIntersection(element({x: 900, y: 0, width: 100, height: 20}), {threshold: 1}),
    ).toBe(true)
    expect(
      measureIntersection(element({x: 950, y: 0, width: 100, height: 20}), {threshold: 1}),
    ).toBe(false)
    expect(
      measureIntersection(element({x: 950, y: 0, width: 100, height: 20}), {threshold: 0}),
    ).toBe(true)
  })
})
