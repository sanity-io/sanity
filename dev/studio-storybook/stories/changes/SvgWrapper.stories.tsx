import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SvgWrapper} from '../../../../packages/sanity/src/core/changeIndicators/overlay/ConnectorsOverlay.styled'

/**
 * `SvgWrapper` is the full-bleed, click-through `<svg>` `ConnectorsOverlay` mounts as the canvas
 * for every connector: `position: absolute; inset: 0; width/height: 100%; pointer-events: none`
 * (`ConnectorsOverlay.css.ts`).
 */
const meta: Meta<typeof SvgWrapper> = {
  title: 'Document Pane/Change Indicators/SvgWrapper',
  component: SvgWrapper,
  parameters: {
    docs: {
      description: {
        component: [
          'With nothing inside it, this component is correctly invisible: no fill, no stroke, no ' +
            'border of its own, and it never even intercepts a click. Its only job is to be a ' +
            'correctly sized, correctly positioned coordinate space for whatever gets drawn inside ' +
            'it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/ConnectorsOverlay.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Positioning | full-bleed, click-through, sized to fill its positioned ancestor |',
          '',
          '> **Why it matters:** an empty render here is not a broken story. It is the correct ' +
            'behaviour of a bare canvas that has nothing yet to draw; every other story on this ' +
            'page gives it a child so its positioning becomes legible.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof SvgWrapper>

/**
 * No children: renders a `<svg>` that fills its container and shows nothing, because it has
 * nothing to draw and no styling of its own beyond positioning. Not a broken story, the correct
 * behaviour of a bare canvas.
 */
export const Empty: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 220,
        height: 100,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <SvgWrapper />
    </div>
  ),
}

/** With a child, to show it fills and aligns with its positioned ancestor (the dashed box). */
export const WithContent: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 220,
        height: 100,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <SvgWrapper>
        <circle cx={40} cy={30} r={4} fill="var(--card-badge-caution-dot-color)" />
        <circle cx={180} cy={70} r={4} fill="var(--card-badge-caution-dot-color)" />
        <path
          d="M40 30 Q110 10 180 70"
          fill="none"
          stroke="var(--card-badge-caution-dot-color)"
          strokeWidth={1}
        />
      </SvgWrapper>
    </div>
  ),
}

/**
 * As `ConnectorsOverlay` actually uses it: mounted once per document pane, absolutely positioned
 * over the whole scroll container. See the `ConnectorsOverlay` page for that real harness.
 */
export const InContext: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 220,
        height: 100,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <SvgWrapper data-testid="change-connectors-overlay" />
    </div>
  ),
}
