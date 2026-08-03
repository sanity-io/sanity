import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ClampedRect} from '../../../../packages/sanity/src/core/changeIndicators/overlay/ClampedRect'

function Canvas({children, caption}: {children: React.ReactNode; caption: string}) {
  return (
    <figure style={{margin: 0}}>
      <svg width={220} height={160} style={{border: '1px solid var(--card-border-color)'}}>
        {children}
      </svg>
      <figcaption
        style={{fontSize: 12, color: 'var(--card-muted-fg-color)', marginTop: 4, maxWidth: 220}}
      >
        {caption}
      </figcaption>
    </figure>
  )
}

/**
 * `ClampedRect` is the geometry primitive `RightBarWrapper` (see that page) is built on: an SVG
 * `<rect>` whose `top`/`left`/`height`/`width` are clamped so it never draws outside a given
 * `bounds` rectangle. This is one of the four geometry primitives the brief calls out for a
 * direct story with literal coordinates, since it takes plain numbers and needs no tracker,
 * no DOM measurement, no laid-out siblings.
 */
const meta: Meta<typeof ClampedRect> = {
  title: 'Document Pane/Change Indicators/ClampedRect',
  component: ClampedRect,
  parameters: {
    docs: {
      description: {
        component: [
          "A connector's right-hand bar must never draw past the edge of the scroll container it " +
            'lives in. This is the primitive that holds that line: an SVG rectangle that clamps ' +
            'its own position and size to stay inside a given boundary.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/ClampedRect.tsx` |',
          '| Tier | SERVICE |',
          "| Used by | `RightBarWrapper`, the connector's right-hand bar |",
          '',
          "The clamp only pulls the rectangle's near edge, top and left, in toward the bounds; it " +
            'never pulls the far edge, bottom and right, back. The size shrinks by however much ' +
            'the position moved, and floors at zero rather than going negative. A rectangle placed ' +
            'entirely below or to the right of its bounds is not clamped at all: it draws exactly ' +
            'where it was asked to, outside the box. See `OverflowsBottom` below.',
          '',
          '> **Why it matters:** a badly out-of-range input does not clamp to as much of the ' +
            'rectangle as overlaps the bounds. It collapses to a zero-size point sitting on the ' +
            "bounds' own corner instead, a different failure than the honest clamp above it, and " +
            'the far-outside story makes that difference visible rather than assumed.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ClampedRect>

const bounds = {top: 20, left: 20, height: 100, width: 160}

function BoundsOutline() {
  return (
    <rect
      x={bounds.left}
      y={bounds.top}
      width={bounds.width}
      height={bounds.height}
      fill="none"
      stroke="var(--card-border-color)"
      strokeDasharray="4 4"
    />
  )
}

/** Fully inside the bounds: the clamp is a no-op, the rect draws exactly as given. */
export const FullyInside: Story = {
  render: () => (
    <Canvas caption="top:40 left:40 height:40 width:80, bounds top:20 left:20 height:100 width:160. No clamping needed.">
      <BoundsOutline />
      <ClampedRect
        top={40}
        left={40}
        height={40}
        width={80}
        bounds={bounds}
        fill="var(--card-badge-caution-dot-color)"
      />
    </Canvas>
  ),
}

/**
 * The rect starts 30px above and 30px left of the bounds' top-left corner. `x`/`y` clamp to the
 * bounds' edge, and `height`/`width` shrink by the same 30px each, so the VISIBLE rect is smaller
 * than requested, not just repositioned.
 */
export const OverflowsTopLeft: Story = {
  render: () => (
    <Canvas caption="top:-10 left:-10 height:60 width:60, clamped to bounds top:20 left:20. Height and width both shrink by 30px.">
      <BoundsOutline />
      <ClampedRect
        top={-10}
        left={-10}
        height={60}
        width={60}
        bounds={bounds}
        fill="var(--card-badge-caution-dot-color)"
      />
    </Canvas>
  ),
}

/**
 * `top + height` exceeds `bounds.top + bounds.height` well past the near-edge clamp, but this
 * function only clamps the NEAR (top-left) edge. Nothing here stops the rect from drawing past
 * the bounds' bottom, and it does: the rect visibly crosses the dashed outline. Not a bug (the
 * one real caller, `RightBarWrapper`, is itself wrapped by a scroll container that clips
 * overflow), but worth seeing rather than assuming from the two clamped stories above.
 */
export const OverflowsBottom: Story = {
  render: () => (
    <Canvas caption="top:90 left:40 height:80 width:60. Bottom edge (top+height=170) is well past bounds.top+bounds.height=120, and is NOT clamped.">
      <BoundsOutline />
      <ClampedRect
        top={90}
        left={40}
        height={80}
        width={60}
        bounds={bounds}
        fill="var(--card-badge-caution-dot-color)"
      />
    </Canvas>
  ),
}

/**
 * Zero-size input: `height: 0, width: 0`. `Math.max(0, 0 - 0)` on both axes: the rect renders,
 * legitimately, as a zero-area rect. Nothing crashes; nothing is visible either, which is
 * correct for a rect with no size.
 */
export const ZeroSize: Story = {
  render: () => (
    <Canvas caption="height:0 width:0: renders a zero-area rect. Nothing visible, and that is correct.">
      <BoundsOutline />
      <ClampedRect
        top={60}
        left={80}
        height={0}
        width={0}
        bounds={bounds}
        fill="var(--card-badge-caution-dot-color)"
        stroke="var(--card-fg-color)"
      />
    </Canvas>
  ),
}

/**
 * The rect is entirely above and left of the bounds by MORE than its own size (`top: -80, left:
 * -80, height: 40, width: 40`). The clamp pulls `x`/`y` to the bounds' corner, then
 * `height - (y - top)` and `width - (x - left)` both go negative before `Math.max(0, ...)`
 * floors them at 0. The rect collapses to a zero-size point sitting exactly on the bounds'
 * top-left corner, not to something the size of the original rect moved into view. Read literally,
 * this means a badly out-of-range input degrades gracefully to "invisible at the corner" rather
 * than clamping to "as much of the rect as overlaps the bounds" (there is no overlap here at all,
 * so both readings agree on nothing being visible, but the collapse-to-a-point behaviour is worth
 * seeing directly rather than inferring).
 */
export const FarOutsideCollapsesToZero: Story = {
  render: () => (
    <Canvas caption="top:-80 left:-80 height:40 width:40, no overlap with bounds at all. Clamped height and width both floor at 0.">
      <BoundsOutline />
      <ClampedRect
        top={-80}
        left={-80}
        height={40}
        width={40}
        bounds={bounds}
        fill="var(--card-badge-caution-dot-color)"
        stroke="var(--card-fg-color)"
      />
    </Canvas>
  ),
}
