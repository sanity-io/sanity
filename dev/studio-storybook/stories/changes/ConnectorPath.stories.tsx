import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConnectorPath} from '../../../../packages/sanity/src/core/changeIndicators/overlay/Connector.styled'
import {arrowPath} from '../../../../packages/sanity/src/core/changeIndicators/overlay/connectorPath'

function Canvas({children}: {children: React.ReactNode}) {
  return (
    <svg width={220} height={120} style={{border: '1px solid var(--card-border-color)'}}>
      {children}
    </svg>
  )
}

/**
 * `ConnectorPath` is the styled `<path>` that draws the connector line and its arrowheads. Its
 * only real input is `d`, an SVG path data string, so per the fixture rule (a renderer may be
 * handed anything, since deciding the shape was somebody else's job) a literal string is honest
 * input here, not an invented state.
 */
const meta: Meta<typeof ConnectorPath> = {
  title: 'Document Pane/Change Indicators/ConnectorPath',
  component: ConnectorPath,
  parameters: {
    docs: {
      description: {
        component: [
          "The connector's curved line and its arrowheads share one drawing primitive: a styled " +
            'path, stroked in a single colour, fed nothing but path data.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/Connector.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Style | `fill: none`, stroked in the caution-dot colour |',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ConnectorPath>

/** A hand-written `d`: a simple curve, to show the stroke on its own. */
export const SimpleCurve: Story = {
  render: () => (
    <Canvas>
      <ConnectorPath d="M20 20 Q110 20 110 60 Q110 100 200 100" strokeWidth={1} />
    </Canvas>
  ),
}

/**
 * `arrowPath` (`connectorPath.ts:9-15`) is the one other exported pure function in this module
 * besides `generateConnectorPath`: three points forming a chevron, `dir` flips it up or down.
 * `Connector` draws one of these at each end that points off-screen (`line.from.isAbove`, etc,
 * see the `Connector` page). Both directions, drawn with the real function rather than a
 * hand-written path.
 */
export const ArrowGlyphs: Story = {
  render: () => (
    <Canvas>
      <ConnectorPath d={arrowPath(60, 40, -1)} strokeWidth={1.5} />
      <ConnectorPath d={arrowPath(140, 80, 1)} strokeWidth={1.5} />
    </Canvas>
  ),
}

/**
 * The real curve, with the real algorithm: `generateConnectorPath` (`connectorPath.ts:31-129`)
 * fed a literal `from`/`to` pair the same shape `mapConnectorToLine` produces. See the `Connector`
 * page for the composed version (this path plus the arrows plus the right-hand bar) and for how
 * these coordinates come from real measured elements.
 */
export const InContext: Story = {
  render: () => (
    <Canvas>
      <ConnectorPath d="M20 30 L46 30 Q54 30 54 38 L54 82 Q54 90 62 90 L200 90" strokeWidth={1} />
    </Canvas>
  ),
}
