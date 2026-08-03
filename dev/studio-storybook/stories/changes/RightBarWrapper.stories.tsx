import {type Meta, type StoryObj} from '@storybook/react-vite'

import {RightBarWrapper} from '../../../../packages/sanity/src/core/changeIndicators/overlay/Connector.styled'

function Canvas({children, caption}: {children: React.ReactNode; caption: string}) {
  return (
    <figure style={{margin: 0}}>
      <svg width={220} height={140} style={{border: '1px solid var(--card-border-color)'}}>
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

/**
 * `RightBarWrapper` is `ClampedRect` (see that page for the full clamp behaviour) styled as the
 * short filled bar the connector draws flush against the change-side field: `fill:
 * --card-badge-caution-dot-color`, `stroke: none` (`Connector.css.ts`'s `rightBarWrapper`).
 * `Connector` positions it at `to.rect.left - 0.5`, one pixel wider than the field it marks
 * (`Connector.tsx:37-43`).
 */
const meta: Meta<typeof RightBarWrapper> = {
  title: 'Document Pane/Change Indicators/RightBarWrapper',
  component: RightBarWrapper,
  parameters: {
    docs: {
      description: {
        component: [
          "This is the short mark drawn at the connector's destination end, echoing the field-side " +
            'change bar from the other side of the panel: the same clamped-rectangle geometry ' +
            'from earlier in this chapter, restyled and repositioned.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/Connector.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Positioned at | one pixel wider than the field it marks |',
          "| Edge behaviour | shares `ClampedRect`'s clamp: only the near edge is clamped, so a target taller than its bounds still overflows the far edge uncorrected |",
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof RightBarWrapper>

/** A normal-sized bar next to a field roughly one line tall, fully inside its bounds. */
export const Default: Story = {
  render: () => (
    <Canvas caption="A single-line field's right bar: 1px wide, the field's own height.">
      <BoundsOutline />
      <RightBarWrapper top={40} left={60} height={20} width={1} bounds={bounds} />
    </Canvas>
  ),
}

/** A taller bar, for a multi-line changed field, still inside the bounds. */
export const TallField: Story = {
  render: () => (
    <Canvas caption="A multi-line field's right bar: same width, taller.">
      <BoundsOutline />
      <RightBarWrapper top={30} left={100} height={70} width={1} bounds={bounds} />
    </Canvas>
  ),
}

/**
 * Placed to overlap the bounds' top-left corner: the shared `ClampedRect` clamp shrinks it, the
 * same way `ClampedRect`'s own `OverflowsTopLeft` story does.
 */
export const ClampedAtEdge: Story = {
  render: () => (
    <Canvas caption="top:0 left:10, clamped against bounds top:20 left:20: shortened from the top.">
      <BoundsOutline />
      <RightBarWrapper top={0} left={10} height={40} width={1} bounds={bounds} />
    </Canvas>
  ),
}

/** As it appears assembled inside `Connector`: see that page for the full composed line. */
export const InContext: Story = {
  render: () => (
    <Canvas caption="The right bar as Connector actually positions it: flush against the destination field.">
      <BoundsOutline />
      <path
        d="M20 40 L120 40 Q128 40 128 48 L128 70"
        fill="none"
        stroke="var(--card-badge-caution-dot-color)"
        strokeWidth={1}
      />
      <RightBarWrapper top={62} left={128} height={20} width={1} bounds={bounds} />
    </Canvas>
  ),
}
