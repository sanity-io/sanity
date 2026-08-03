import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  ConnectorPath,
  InteractivePath,
} from '../../../../packages/sanity/src/core/changeIndicators/overlay/Connector.styled'

function Canvas({children}: {children: React.ReactNode}) {
  return (
    <svg width={220} height={80} style={{border: '1px solid var(--card-border-color)'}}>
      {children}
    </svg>
  )
}

/**
 * `InteractivePath` is a WIDE, TRANSPARENT twin of `ConnectorPath`, drawn along the identical
 * `d`, purely to widen the clickable/hoverable hit area of a thin 1px line. `Connector` renders
 * this and the real visible path as a pair, always the same `d`, different stroke widths
 * (`Connector.tsx:33-35`: `INTERACTIVE_STROKE_WIDTH` is 16, `STROKE_WIDTH` is 1).
 */
const meta: Meta<typeof InteractivePath> = {
  title: 'Document Pane/Change Indicators/InteractivePath',
  component: InteractivePath,
  parameters: {
    docs: {
      description: {
        component: [
          'A one-pixel line is a poor click target. This is its invisible, wide twin, drawn along ' +
            'the identical path purely to widen the hoverable and clickable area around the thin ' +
            'visible stroke.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/Connector.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Stroke widths | 16px hit area over a 1px visible line, same path data |',
          '',
          'At rest it is fully transparent, and only the stroked outline itself is clickable, not ' +
            'its bounding box. A static, unhovered screenshot of this component alone shows ' +
            'literally nothing.',
          '',
          '> **Why it matters:** this is the same invisible-by-design pattern the click target ' +
            'earlier in this chapter uses: present, sized, interactive, and correctly showing ' +
            'nothing until hovered.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof InteractivePath>

const D = 'M20 40 Q110 10 200 40'

/**
 * At rest: `opacity: 0`. The dashed outline marks where the path actually sits so the invisible
 * claim above is checkable, not asserted.
 */
export const RestingInvisible: Story = {
  render: () => (
    <Canvas>
      <path
        d={D}
        fill="none"
        stroke="var(--card-border-color)"
        strokeDasharray="2 3"
        strokeWidth={1}
      />
      <InteractivePath d={D} strokeWidth={16} />
    </Canvas>
  ),
}

/** Hover the wide invisible stroke: `opacity` rises to 0.2, a faint band around the real line. */
export const HoverWidensVisibly: Story = {
  render: () => (
    <Canvas>
      <InteractivePath d={D} strokeWidth={16} />
    </Canvas>
  ),
}

/** Layered the way `Connector` actually pairs them: the thin real line drawn on top of the wide hit area. */
export const InContext: Story = {
  render: () => (
    <Canvas>
      <InteractivePath d={D} strokeWidth={16} />
      <ConnectorPath d={D} strokeWidth={1} />
    </Canvas>
  ),
}
