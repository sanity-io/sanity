import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  ChangeBar,
  ChangeBarMarker,
} from '../../../../packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled'

/**
 * `ChangeBar` is the container `ElementWithChangeBar` mounts around `ChangeBarMarker` and the
 * tooltip-wrapped `ChangeBarButton`. It sets `position: relative` so those two absolutely
 * positioned children have something to anchor to, but it has NO explicit height of its own.
 */
const meta: Meta<typeof ChangeBar> = {
  title: 'Document Pane/Change Indicators/ChangeBar',
  component: ChangeBar,
  parameters: {
    docs: {
      description: {
        component: [
          'Neither of the two children this container holds carries any height of its own; both ' +
            'are positioned absolutely, so without an anchor between them and the field beside ' +
            'them, both collapse to nothing. This container is that anchor.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Mechanism | `position: relative`, no intrinsic height of its own |',
          '',
          'It gets its own height for free in production: a surrounding flex row stretches it to ' +
            'match the field it sits beside. Mounted with no stretching sibling, it collapses to ' +
            'zero height and its children render invisibly along with it.',
          '',
          '> **Why it matters:** the two stories below make the failure literal. One mounts this ' +
            'component with nothing around it, and the marker vanishes. The other gives it the ' +
            'height its real home provides, and the marker reappears. Neither story is staged; ' +
            'both are the same markup with one property changed.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ChangeBar>

/**
 * Mounted with no stretching sibling and no explicit height. This renders EMPTY: `ChangeBar`
 * collapses to zero height, so its marker (itself absolutely positioned top/bottom) has nothing
 * to fill. This is the honest, literal isolated render, kept as a page rather than deleted, to
 * show why every other story on this page gives it height explicitly.
 */
export const Isolated: Story = {
  render: () => (
    <div style={{border: '1px dashed var(--card-border-color)', width: 24}}>
      <ChangeBar zIndex={1}>
        <ChangeBarMarker />
      </ChangeBar>
    </div>
  ),
}

/**
 * The same markup, with an explicit height on the container, mirroring what the real flex row
 * provides. The marker's line becomes visible.
 */
export const WithHeight: Story = {
  render: () => (
    <div style={{position: 'relative', width: 24, height: 56}}>
      <ChangeBar zIndex={1}>
        <ChangeBarMarker />
      </ChangeBar>
    </div>
  ),
}

/**
 * As it appears assembled inside `ElementWithChangeBar`, stretched by the real flex row next to
 * a field. See that page for the full composition including the button.
 */
export const InContext: Story = {
  render: () => (
    <div style={{display: 'flex', width: 240}}>
      <div style={{flexGrow: 1, minWidth: 0}}>
        <Card padding={3} radius={2} border>
          <Text size={1}>Title</Text>
        </Card>
      </div>
      <ChangeBar zIndex={1}>
        <ChangeBarMarker />
      </ChangeBar>
    </div>
  ),
}
