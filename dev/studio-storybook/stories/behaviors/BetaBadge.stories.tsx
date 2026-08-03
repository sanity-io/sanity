import {Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). BetaBadge is a fixed-tone
// `@sanity/ui` Badge (primary tone, radius 2, default text "Beta") used to mark
// experimental features in the Studio UI. Pure presentation, no provider stack.
import {BetaBadge} from '../../../../packages/sanity/src/core/components/BetaBadge'

const meta: Meta<typeof BetaBadge> = {
  title: 'Laws & Behaviors/BetaBadge',
  component: BetaBadge,
  args: {fontSize: 1},
  argTypes: {
    fontSize: {control: {type: 'number', min: 0, max: 4, step: 1}},
  },
  render: (props) => (
    <Card padding={4} radius={2} shadow={1} style={{display: 'inline-block'}}>
      <BetaBadge {...props} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'When something ships in front of editors before it is finished, a Content Release, a ' +
            'new inspector, an experiment, there needs to be one honest, unmissable way to say ' +
            'this is still early. BetaBadge is that marker, and it is deliberately impossible to ' +
            'recolor.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/BetaBadge.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | CHROME. A one-line convenience over `@sanity/ui` `Badge` that locks tone/radius and defaults the text to "Beta"; `tone` and `mode` are intentionally omitted from its props |',
          '| Audit | ⚪ not-audited as a unit. The maturity-signalling counterpart to `governance-deprecation` (ch11): where the audit found deprecated affordances left visually indistinguishable from live ones, BetaBadge is the sanctioned way to flag not-yet-stable ones |',
          '| Patterns | `governance-deprecation` |',
          '',
          'Reach for it and every not-yet-stable feature in Studio wears the same marker, so ' +
            'the signal reads the same everywhere an editor meets it. The `children` default is ' +
            '"Beta", but any short label works ("Alpha", "New", "Experimental"); `fontSize` is ' +
            'the only real dial. The sweeps below show the default, alternate labels, and the ' +
            'font-size scale.',
          '',
          '> **Why it matters:** tone and mode are deliberately not exposed, you cannot recolor ' +
            'it. That uniform primary tone is the point: an experimental marker only works as a ' +
            'signal if it looks identical everywhere, so the badge trades flexibility for ' +
            'consistency on purpose.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:systems',
    'pattern:governance-deprecation',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof BetaBadge>

/** Playground: the default "Beta" badge; adjust `fontSize` from controls. */
export const Default: Story = {}

/** In context: a feature label with its maturity badge trailing. */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Inline gap={2}>
        <Text size={1} weight="medium">
          Content Releases
        </Text>
        <BetaBadge />
      </Inline>
    </Card>
  ),
}

/** Alternate labels: the same badge styling with different maturity text. */
export const Labels: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Flex gap={3} align="center">
        {['Beta', 'Alpha', 'New', 'Experimental'].map((label) => (
          <BetaBadge key={label}>{label}</BetaBadge>
        ))}
      </Flex>
    </Card>
  ),
}

/** The font-size scale. */
export const FontSizes: Story = {
  name: 'Font sizes',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Flex gap={3} align="center">
        {[0, 1, 2, 3].map((fontSize) => (
          <Stack key={fontSize} gap={3} style={{textAlign: 'center'}}>
            <BetaBadge fontSize={fontSize} />
            <Text size={0} muted>
              {fontSize}
            </Text>
          </Stack>
        ))}
      </Flex>
    </Card>
  ),
}
