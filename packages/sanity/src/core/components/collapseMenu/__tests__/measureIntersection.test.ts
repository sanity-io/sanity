import {afterEach, describe, expect, it, vi} from 'vitest'

import {measureIntersection, reachesThreshold} from '../measureIntersection'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** An element whose layout is the given box; jsdom lays nothing out itself */
function element(box: Box, {border = 0, overflow}: {border?: number; overflow?: string} = {}) {
  const el = document.createElement('div')
  if (overflow) el.style.overflow = overflow
  el.getBoundingClientRect = () =>
    DOMRect.fromRect({x: box.x, y: box.y, width: box.width, height: box.height})
  Object.defineProperties(el, {
    clientLeft: {value: border},
    clientTop: {value: border},
    clientWidth: {value: box.width - 2 * border},
    clientHeight: {value: box.height - 2 * border},
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
