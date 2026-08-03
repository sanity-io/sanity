import {Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  ChangeBarMarker,
  ChangeBarWrapper,
} from '../../../../packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled'

/**
 * A naming collision worth stating up front. There are TWO things called `ChangeBarWrapper` in
 * this codebase:
 *
 * - a module-local (unexported) `const ChangeBarWrapper = memo(...)` in `ChangeIndicator.tsx`,
 *   which does the path-tracking work. It cannot be storied directly (rule 2, storybook-authoring
 *   skill: exporting it would mean patching component source). See the `ChangeIndicator` page,
 *   the only place its behaviour is reachable.
 * - the EXPORTED, purely presentational `ChangeBarWrapper` below, from
 *   `ElementWithChangeBar.styled.tsx`. This is the one storied here, and it is the one the
 *   brief's component list names.
 */
const meta: Meta<typeof ChangeBarWrapper> = {
  title: 'Document Pane/Change Indicators/ChangeBarWrapper (styled)',
  component: ChangeBarWrapper,
  parameters: {
    docs: {
      description: {
        component: [
          "None of this component's own props change how it looks. They exist to hand the marker " +
            'and the button nested inside it something to select against, and nothing else.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Layout | flex row, `position: relative` |',
          '',
          'Each modifier class the props toggle is an empty style block: a class name for the ' +
            "marker's and the button's own descendant selectors to key off, not a rule that draws " +
            'anything here. Toggle these props with nothing nested inside and the render is ' +
            'identical either way; the story below nests a real marker so the effect the props ' +
            'actually drive has somewhere to show up.',
          '',
          '> **Why it matters:** read the difference in the marker, never in this wrapper. A page ' +
            'that judges this component by its own appearance will always see nothing change.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ChangeBarWrapper>

function Row({
  label,
  changed,
  hasFocus,
  disabled,
  isReviewChangeOpen,
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
      <div style={{height: 32, width: 120, position: 'relative'}}>
        <ChangeBarWrapper
          changed={changed}
          hasFocus={hasFocus}
          disabled={disabled}
          isReviewChangeOpen={isReviewChangeOpen}
          style={{height: '100%'}}
        >
          <ChangeBarMarker />
        </ChangeBarWrapper>
      </div>
    </Stack>
  )
}

/**
 * The four modifier classes side by side, each nesting a `ChangeBarMarker` so the marker's
 * ancestor-selector CSS has something to key off. Read the difference in the marker's vertical
 * line, not in this component.
 */
export const ModifierStates: Story = {
  render: () => (
    <Flex gap={5} wrap="wrap">
      <Row label="changed" changed hasFocus={false} isReviewChangeOpen={false} />
      <Row label="changed + focused" changed hasFocus isReviewChangeOpen={false} />
      <Row label="not changed" changed={false} isReviewChangeOpen={false} />
      <Row label="disabled" changed disabled isReviewChangeOpen={false} />
    </Flex>
  ),
}

/** As it appears assembled inside `ElementWithChangeBar`: see that page for the full composition. */
export const InContext: Story = {
  render: () => (
    <Row label="Assembled (see ElementWithChangeBar)" changed hasFocus isReviewChangeOpen={false} />
  ),
}
