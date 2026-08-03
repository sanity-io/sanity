import {type Meta, type StoryObj} from '@storybook/react-vite'

import {Connector} from '../../../../packages/sanity/src/core/changeIndicators/overlay/Connector'
import {type Rect} from '../../../../packages/sanity/src/core/changeIndicators/overlay/types'

// `Rect` uses `top`/`left`; SVG `<rect>` wants `x`/`y`. A plain spread of a `Rect` onto a
// `<rect>` silently drops both (invalid attribute names) and draws at the origin instead of
// where the rect actually is, so this maps the fields explicitly rather than spreading.
function rectAttrs(rect: Rect) {
  return {x: rect.left, y: rect.top, width: rect.width, height: rect.height}
}

function Canvas({
  children,
  fieldRect,
  changeRect,
  caption,
}: {
  children: React.ReactNode
  fieldRect: Rect
  changeRect: Rect
  caption: string
}) {
  return (
    <figure style={{margin: 0}}>
      <svg width={320} height={160} style={{border: '1px solid var(--card-border-color)'}}>
        {/* Context rects, drawn plainly, to show what the connector is actually joining: not
            part of `Connector` itself, just orientation for the reader. */}
        <rect
          {...rectAttrs(fieldRect)}
          fill="var(--card-focus-ring-color, #3b82f6)"
          opacity={0.15}
        />
        <rect
          {...rectAttrs(changeRect)}
          fill="var(--card-badge-positive-dot-color, #16a34a)"
          opacity={0.15}
        />
        {children}
      </svg>
      <figcaption
        style={{fontSize: 12, color: 'var(--card-muted-fg-color)', marginTop: 4, maxWidth: 320}}
      >
        {caption}
      </figcaption>
    </figure>
  )
}

/**
 * `Connector` is the geometry component the whole subsystem is named after: given a `from` field
 * rect and a `to` change rect (each with its own scroll `bounds`), it computes and draws the
 * curved line, the destination bar, and any off-screen arrows. Per the brief, this is the second
 * geometry primitive that takes coordinates directly and earns a literal-coordinate story rather
 * than a live-measurement harness.
 */
const meta: Meta<typeof Connector> = {
  title: 'Document Pane/Change Indicators/Connector',
  component: Connector,
  parameters: {
    docs: {
      description: {
        component: [
          'The subsystem takes its name from this component: given a changed field and its diff, ' +
            'each with its own scroll boundary, it draws the curved line between them, the ' +
            'destination bar, and any arrows for the ends that have scrolled out of view.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/Connector.tsx` |',
          '| Tier | SERVICE |',
          '| Renders nothing when | both ends are out of bounds |',
          '',
          'One end out of bounds still draws: the visible line runs to an arrow at the boundary ' +
            'instead of to the real, off-screen rectangle. Only when both ends report out of ' +
            'bounds does the component render nothing at all.',
          '',
          '> **Why it matters:** the both-ends-out-of-bounds story below is a genuinely empty ' +
            'render, by design, not a story that failed to find its subject.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof Connector>

const scrollBounds: Rect = {top: 10, left: 10, height: 140, width: 300}

/** Two boxes at similar heights, both fully inside the scroll bounds: a simple near-horizontal curve. */
export const AlignedFields: Story = {
  render: () => {
    const fieldRect: Rect = {top: 40, left: 20, height: 24, width: 120}
    const changeRect: Rect = {top: 48, left: 220, height: 24, width: 80}
    return (
      <Canvas
        fieldRect={fieldRect}
        changeRect={changeRect}
        caption="Field (blue) and change (green) at similar heights: the connector runs nearly straight across."
      >
        <Connector
          from={{rect: fieldRect, bounds: scrollBounds}}
          to={{rect: changeRect, bounds: scrollBounds}}
        />
      </Canvas>
    )
  },
}

/** The two rects sit far apart vertically: the curve S-bends to join them. */
export const OffsetFields: Story = {
  render: () => {
    const fieldRect: Rect = {top: 20, left: 20, height: 20, width: 120}
    const changeRect: Rect = {top: 110, left: 220, height: 20, width: 80}
    return (
      <Canvas
        fieldRect={fieldRect}
        changeRect={changeRect}
        caption="Field near the top, change near the bottom: the curve bends to join them without crossing either rect."
      >
        <Connector
          from={{rect: fieldRect, bounds: scrollBounds}}
          to={{rect: changeRect, bounds: scrollBounds}}
        />
      </Canvas>
    )
  },
}

/**
 * The field's rect sits above its own bounds (scrolled out of view). `line.from.isAbove` fires,
 * and `Connector` draws a small upward-pointing arrow at the boundary instead of running the
 * line to the field's real (off-screen) position.
 */
export const FieldScrolledAboveBounds: Story = {
  render: () => {
    const fieldBounds: Rect = {top: 40, left: 10, height: 100, width: 140}
    const fieldRect: Rect = {top: -30, left: 20, height: 20, width: 100}
    const changeRect: Rect = {top: 70, left: 220, height: 20, width: 80}
    return (
      <Canvas
        fieldRect={{...fieldRect, top: Math.max(fieldRect.top, 0)}}
        changeRect={changeRect}
        caption="The field's rect (top:-30) sits above its own bounds (top:40): an arrow marks the boundary instead of pointing at an off-canvas rect."
      >
        <rect
          {...rectAttrs(fieldBounds)}
          fill="none"
          stroke="var(--card-border-color)"
          strokeDasharray="3 3"
        />
        <Connector
          from={{rect: fieldRect, bounds: fieldBounds}}
          to={{rect: changeRect, bounds: scrollBounds}}
        />
      </Canvas>
    )
  },
}

/**
 * Both ends report `outOfBounds`. `Connector` returns `null`: nothing renders, not even a
 * fallback mark. This is the correct, empty output for this input, kept as its own story so it
 * is not mistaken for a story that failed to mount.
 */
export const BothEndsOutOfBounds: Story = {
  render: () => {
    const fieldBounds: Rect = {top: 40, left: 10, height: 60, width: 140}
    const changeBounds: Rect = {top: 40, left: 180, height: 60, width: 140}
    const fieldRect: Rect = {top: -40, left: 20, height: 20, width: 100}
    const changeRect: Rect = {top: 140, left: 200, height: 20, width: 100}
    return (
      <Canvas
        fieldRect={{...fieldRect, top: 0}}
        changeRect={{...changeRect, top: 100}}
        caption="Both rects are scrolled out of their own bounds. Connector renders null: an intentionally empty story."
      >
        <rect
          {...rectAttrs(fieldBounds)}
          fill="none"
          stroke="var(--card-border-color)"
          strokeDasharray="3 3"
        />
        <rect
          {...rectAttrs(changeBounds)}
          fill="none"
          stroke="var(--card-border-color)"
          strokeDasharray="3 3"
        />
        <Connector
          from={{rect: fieldRect, bounds: fieldBounds}}
          to={{rect: changeRect, bounds: changeBounds}}
        />
      </Canvas>
    )
  },
}
