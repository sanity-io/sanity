import {describe, expect, it} from 'vitest'

import {
  anchorOrigin,
  isPanelCorner,
  moveCorner,
  type PanelCorner,
  type Point,
  rebaseAnchor,
  releaseCorner,
  restingAnchor,
  type Size,
} from './corners'

const VIEWPORT: Size = {width: 1000, height: 600}
const PANEL: Size = {width: 320, height: 360}
const CORNERS: PanelCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

const AT_REST: Point = {x: 0, y: 0}

/** What the browser draws from `translate(anchor) translate(origin)`. */
function drawnBox(anchor: Point, corner: PanelCorner, size: Size) {
  const origin = anchorOrigin(corner)
  const left = anchor.x - (origin.x === '-100%' ? size.width : 0)
  const top = anchor.y - (origin.y === '-100%' ? size.height : 0)
  return {left, top, right: left + size.width, bottom: top + size.height}
}

function centerOf(box: {left: number; top: number; right: number; bottom: number}): Point {
  return {x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2}
}

describe('restingAnchor and anchorOrigin', () => {
  it('hangs the widget off its docked corner, the same distance from both edges', () => {
    const gaps = CORNERS.map((corner) => {
      const box = drawnBox(restingAnchor(corner, VIEWPORT), corner, PANEL)
      return {
        corner,
        horizontal: corner.endsWith('left') ? box.left : VIEWPORT.width - box.right,
        vertical: corner.startsWith('top') ? box.top : VIEWPORT.height - box.bottom,
      }
    })
    const [first] = gaps
    expect(first.horizontal).toBeGreaterThan(0)
    for (const gap of gaps) {
      expect(gap).toEqual({
        corner: gap.corner,
        horizontal: first.horizontal,
        vertical: first.horizontal,
      })
    }
  })

  it('keeps a docked widget inside the viewport', () => {
    for (const corner of CORNERS) {
      const box = drawnBox(restingAnchor(corner, VIEWPORT), corner, PANEL)
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.top).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(VIEWPORT.width)
      expect(box.bottom).toBeLessThanOrEqual(VIEWPORT.height)
    }
  })

  it('needs no repositioning when the widget changes size', () => {
    // A collapsed trigger and an open panel docked in the same corner share an
    // anchor, which is what lets the panel open without being moved.
    const collapsed: Size = {width: 36, height: 36}
    const anchor = restingAnchor('bottom-right', VIEWPORT)
    expect(drawnBox(anchor, 'bottom-right', PANEL).bottom).toBe(
      drawnBox(anchor, 'bottom-right', collapsed).bottom,
    )
    expect(drawnBox(anchor, 'bottom-right', PANEL).right).toBe(
      drawnBox(anchor, 'bottom-right', collapsed).right,
    )
  })
})

describe('rebaseAnchor', () => {
  it('holds the widget still while the corner it hangs from changes', () => {
    const dragged: Point = {x: 420, y: 260}
    for (const from of CORNERS) {
      const before = drawnBox(dragged, from, PANEL)
      for (const to of CORNERS) {
        const after = drawnBox(rebaseAnchor(dragged, PANEL, from, to), to, PANEL)
        expect(after).toEqual(before)
      }
    }
  })

  it('is its own inverse', () => {
    const dragged: Point = {x: 111, y: 222}
    const there = rebaseAnchor(dragged, PANEL, 'top-left', 'bottom-right')
    expect(rebaseAnchor(there, PANEL, 'bottom-right', 'top-left')).toEqual(dragged)
  })
})

describe('releaseCorner', () => {
  it('takes the nearest corner when the widget is let go at rest', () => {
    const cases: [Point, PanelCorner][] = [
      [{x: 100, y: 100}, 'top-left'],
      [{x: 900, y: 100}, 'top-right'],
      [{x: 100, y: 500}, 'bottom-left'],
      [{x: 900, y: 500}, 'bottom-right'],
    ]
    for (const [center, expected] of cases) {
      expect(releaseCorner(center, AT_REST, VIEWPORT)).toBe(expected)
    }
  })

  it('carries a flick past the corner it was let go over', () => {
    // Let go on the left, but travelling right at 900px/s: it comes to rest on
    // the right, so that is where it docks.
    const center: Point = {x: 300, y: 500}
    expect(releaseCorner(center, AT_REST, VIEWPORT)).toBe('bottom-left')
    expect(releaseCorner(center, {x: 900, y: 0}, VIEWPORT)).toBe('bottom-right')
    expect(releaseCorner(center, {x: 0, y: -900}, VIEWPORT)).toBe('top-left')
  })

  it('ignores a dribble that would not carry the widget across', () => {
    expect(releaseCorner({x: 300, y: 500}, {x: 60, y: -60}, VIEWPORT)).toBe('bottom-left')
  })

  it('decides each axis on the half of the viewport the widget rests in', () => {
    // The two docked positions on an axis are symmetric about the middle, so the
    // nearer half is the nearer docked position for any widget size.
    const middle = {x: VIEWPORT.width / 2, y: VIEWPORT.height / 2}
    expect(releaseCorner({x: middle.x - 1, y: middle.y - 1}, AT_REST, VIEWPORT)).toBe('top-left')
    expect(releaseCorner({x: middle.x + 1, y: middle.y + 1}, AT_REST, VIEWPORT)).toBe(
      'bottom-right',
    )
    for (const corner of CORNERS) {
      const resting = centerOf(drawnBox(restingAnchor(corner, VIEWPORT), corner, PANEL))
      expect(releaseCorner(resting, AT_REST, VIEWPORT)).toBe(corner)
    }
  })
})

describe('moveCorner', () => {
  it('moves along one axis and stays put on the other', () => {
    expect(moveCorner('bottom-left', 'up')).toBe('top-left')
    expect(moveCorner('bottom-left', 'right')).toBe('bottom-right')
    expect(moveCorner('top-right', 'down')).toBe('bottom-right')
    expect(moveCorner('top-right', 'left')).toBe('top-left')
  })

  it('stays where it is at the edge it is already against', () => {
    expect(moveCorner('top-left', 'up')).toBe('top-left')
    expect(moveCorner('top-left', 'left')).toBe('top-left')
  })
})

describe('isPanelCorner', () => {
  it('accepts the four corners and rejects anything else', () => {
    for (const corner of CORNERS) expect(isPanelCorner(corner)).toBe(true)
    for (const value of ['left', 'top-center', '', null, undefined, 0, {}]) {
      expect(isPanelCorner(value)).toBe(false)
    }
  })
})
