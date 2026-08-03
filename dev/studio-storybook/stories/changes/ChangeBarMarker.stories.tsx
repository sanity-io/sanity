import {Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  ChangeBarMarker,
  ChangeBarWrapper,
} from '../../../../packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled'

/**
 * `ChangeBarMarker` is the 1px vertical line an editor actually sees: everything else on this
 * page's neighbouring pages (`ChangeBar`, `ChangeBarWrapper`, `ChangeBarButton`) is either an
 * invisible hit target or a layout shell.
 */
const meta: Meta<typeof ChangeBarMarker> = {
  title: 'Document Pane/Change Indicators/ChangeBarMarker',
  component: ChangeBarMarker,
  parameters: {
    docs: {
      description: {
        component: [
          'The one-pixel line an editor actually sees. Everything else in this family is either ' +
            'an invisible hit target or a layout shell; this is the mark itself.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Opacity states | 0.5 resting, 1.0 on focus, 0 when not changed, hidden when disabled |',
          '',
          'None of those states live on the marker itself; it takes no relevant props at all. Every ' +
            'one of them is a selector keyed off its wrapper, so mounted with no wrapper ancestor ' +
            'none of the dimming or hiding rules match, and the mark defaults to fully opaque, ' +
            'more visible than any real resting state ever is.',
          '',
          '> **Why it matters:** the isolated story below is that literal, misleadingly bold render, ' +
            'kept rather than deleted because it makes the point on its own: every other story on ' +
            'this page nests the real ancestor, and the opacity shown only matches production when ' +
            'that ancestor is there.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ChangeBarMarker>

/**
 * No `ChangeBarWrapper` ancestor. The `::after` pseudo-element still renders (the base rule sets
 * its content, position and colour unconditionally) but at full opacity, since none of the
 * dimming/hiding selectors have an ancestor class to match. This never happens in the shipped
 * product; kept here so the difference from `RestingInWrapper` is visible rather than assumed.
 */
export const Isolated: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 24,
        height: 56,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <ChangeBarMarker />
    </div>
  ),
}

function Wrapped({
  label,
  ...wrapperProps
}: {
  label: string
  changed?: boolean
  hasFocus?: boolean
  disabled?: boolean
  isReviewChangeOpen: boolean
}) {
  return (
    <Stack gap={2}>
      <Text size={1} muted>
        {label}
      </Text>
      <div style={{height: 56, width: 24, position: 'relative'}}>
        <ChangeBarWrapper {...wrapperProps} style={{height: '100%'}}>
          <ChangeBarMarker />
        </ChangeBarWrapper>
      </div>
    </Stack>
  )
}

/** The real resting state: nested in `ChangeBarWrapper` with `changed`, no focus. 0.5 opacity. */
export const RestingInWrapper: Story = {
  render: () => (
    <Wrapped label="changed, resting" changed hasFocus={false} isReviewChangeOpen={false} />
  ),
}

/** `ChangeBarWrapper`'s `hasFocus` set: the marker reaches full opacity. */
export const FocusedInWrapper: Story = {
  render: () => <Wrapped label="changed, focused" changed hasFocus isReviewChangeOpen={false} />,
}

/** `changed={false}`: the marker is present in the DOM but `opacity: 0`, invisible on purpose. */
export const NotChangedInWrapper: Story = {
  render: () => <Wrapped label="not changed" changed={false} isReviewChangeOpen={false} />,
}

/** All four states side by side, for a direct visual comparison. */
export const AllStates: Story = {
  render: () => (
    <Flex gap={5} wrap="wrap">
      <Wrapped label="resting" changed hasFocus={false} isReviewChangeOpen={false} />
      <Wrapped label="focused" changed hasFocus isReviewChangeOpen={false} />
      <Wrapped label="not changed" changed={false} isReviewChangeOpen={false} />
      <Wrapped label="disabled" changed disabled isReviewChangeOpen={false} />
    </Flex>
  ),
}

/** As it appears assembled inside `ElementWithChangeBar`: see that page for the full composition. */
export const InContext: Story = {
  render: () => (
    <Wrapped
      label="Assembled (see ElementWithChangeBar)"
      changed
      hasFocus
      isReviewChangeOpen={false}
    />
  ),
}
