import {type BadgeTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  getVersionInlineBadge,
  VersionInlineBadge,
} from '../../../../packages/sanity/src/core/releases/components/VersionInlineBadge'
import {releaseFixtures} from '../../lib/releaseFixtures'

const TONES: BadgeTone[] = [
  'default',
  'primary',
  'positive',
  'caution',
  'critical',
  'suggest',
  'neutral',
]

const meta: Meta<typeof VersionInlineBadge> = {
  title: 'Releases/Version Inline Badge',
  component: VersionInlineBadge,
  args: {children: 'Autumn campaign', $tone: 'suggest'},
  argTypes: {$tone: {control: 'select', options: TONES}},
  parameters: {
    docs: {
      description: {
        component: [
          'This is the component that makes release copy translatable: because it is an inline ' +
            'span rather than a sentence broken into pieces, the whole sentence stays one ' +
            'translation key and a translator can move the badge wherever their grammar puts it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/VersionInlineBadge.tsx` |',
          '| Tier | CHROME |',
          '',
          "A release name set inline inside a sentence, tinted to that release's tone. It is " +
            'what turns "This document is in Autumn campaign" from a sentence with a name in it ' +
            'into a sentence with a release in it. A styled `<span>`, deliberately: it has to sit ' +
            'in the text flow, wrap with it, and inherit the line height around it. A `<Card>` or ' +
            'a `Badge` would be a block in the middle of a paragraph.',
          '',
          'Pair it with `getVersionInlineBadge(release)`, which resolves the tone from the ' +
            'release document and returns a component ready to hand to the i18n `<Translate>` ' +
            'helper.',
          '',
          '> **Why it matters:** the alternative pattern, a sentence broken into three pieces so a ' +
            'badge can be dropped in the middle, hard-codes English word order and hands ' +
            'translators fragments instead of a sentence. That is why this appears in nearly every ' +
            'release dialog and banner: the copy does the explaining and the badge does the ' +
            'pointing.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:releases', 'chapter:cms', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof VersionInlineBadge>

export const Default: Story = {
  name: 'A badge in a sentence',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state. Change the tone in the controls to see the palette; the point of the story is that the badge sits on the text baseline rather than knocking the line out of alignment.',
      },
    },
  },
  render: (args) => (
    <Text size={1}>
      This document has a version in <VersionInlineBadge {...args} />.
    </Text>
  ),
}

export const ToneMatrix: Story = {
  name: 'Every tone',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The full palette. In practice releases only ever produce four of these - caution for asap, suggest for scheduled, neutral for undecided, default for archived - but the component accepts any `BadgeTone` because non-release callers use it too.',
      },
    },
  },
  render: () => (
    <Flex gap={3} wrap="wrap">
      {TONES.map((tone) => (
        <Text key={tone} size={1}>
          <VersionInlineBadge $tone={tone}>{tone}</VersionInlineBadge>
        </Text>
      ))}
    </Flex>
  ),
}

export const ResolvedFromRelease: Story = {
  name: 'Tone resolved from the release',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          '`getVersionInlineBadge(release)` runs the same `getReleaseTone` the avatar uses and hands back a bound component. This is the form call sites actually use, and it is what keeps a release the same colour in a sentence as it is in the perspective menu two surfaces away.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      {Object.entries(releaseFixtures).map(([key, release]) => {
        const Badge = getVersionInlineBadge(release)
        return (
          <Text key={key} size={1}>
            <Badge>{release.metadata.title}</Badge>{' '}
            <Text as="span" size={0} muted>
              ({key})
            </Text>
          </Text>
        )
      })}
    </Stack>
  ),
}

export const Wrapping: Story = {
  name: 'Inside wrapping copy',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The reason it is a span, shown in a narrow column: the badge flows with the paragraph and breaks across lines like any other word. A block-level badge would force a line break before and after itself wherever it landed.',
      },
    },
  },
  render: () => {
    const Badge = getVersionInlineBadge(releaseFixtures.scheduled)
    return (
      <Card border radius={2} padding={3} style={{maxWidth: 260}}>
        <Text size={1}>
          Discarding this version removes it from <Badge>active Release</Badge> only. The published
          document and any other version of it are left untouched.
        </Text>
      </Card>
    )
  },
}

export const InContext: Story = {
  name: 'In context - release copy',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Three of the sentences an editor actually meets, each naming a differently-toned release. Read them together and the pattern is clear: the copy carries the meaning and the badge carries the identity, so neither has to be duplicated in the other.',
      },
    },
  },
  render: () => {
    const Asap = getVersionInlineBadge(releaseFixtures.asap)
    const Scheduled = getVersionInlineBadge(releaseFixtures.scheduled)
    const Archived = getVersionInlineBadge(releaseFixtures.archived)
    return (
      <Stack gap={4} style={{maxWidth: 420}}>
        <Card border radius={2} padding={3} tone="caution">
          <Text size={1}>
            You are editing a version in <Asap>active asap Release</Asap>, which publishes as soon
            as the release is published.
          </Text>
        </Card>
        <Card border radius={2} padding={3} tone="transparent">
          <Text size={1}>
            A copy of this document was added to <Scheduled>active Release</Scheduled>.
          </Text>
        </Card>
        <Card border radius={2} padding={3} tone="transparent">
          <Text size={1}>
            <Archived>archived Release</Archived> is archived. Its documents are read-only.
          </Text>
        </Card>
      </Stack>
    )
  },
}
