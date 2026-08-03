import {type ReleaseType} from '@sanity/client'
import {type BadgeTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  ReleaseAvatar,
  ReleaseAvatarIcon,
} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {releaseFixtures} from '../../lib/releaseFixtures'

const RELEASE_TYPES: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const TONES: BadgeTone[] = ['default', 'primary', 'positive', 'caution', 'critical', 'suggest']

const meta: Meta<typeof ReleaseAvatar> = {
  title: 'Releases/Release Avatar',
  component: ReleaseAvatar,
  parameters: {
    docs: {
      description: {
        component: [
          'The avatar takes its input three different ways, and they are not interchangeable: ' +
            'one of them tells the truth about a real release and the other two do not.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/ReleaseAvatar.tsx` |',
          '| Tier | CHROME |',
          '| Patterns | `similarity` |',
          '',
          'The small coloured glyph that stands for a release everywhere it appears: the ' +
            'perspective menu, the version chips in a document header, the releases table, every ' +
            'menu item that names a release. Three glyphs carry the whole vocabulary: a bolt for ' +
            'asap (publishes the moment it is released), a clock for scheduled (has a date), a ' +
            'dot for undecided (no date yet). The tone comes from `getReleaseTone`, so colour and ' +
            'shape always agree.',
          '',
          'Note the component is deliberately shape-first: the three glyphs differ in ' +
            'silhouette, not only in hue, so the distinction survives a grayscale render.',
          '',
          '> **Why it matters:** pass `releaseType` and you get the glyph for that type, full ' +
            'stop. Pass `release` and the component reads the whole document, state, cardinality, ' +
            'intended publish date, and can override the type: an archived release goes ' +
            'default-toned whatever it was, and a single-document scheduled draft renders a clock ' +
            'in caution even though nothing about its release type changed. Pass the deprecated ' +
            'tone form and you get a dot in that colour with no semantics at all. The release ' +
            'form is the only one that tells the truth about a real release. The stories below ' +
            'lead with it.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:similarity',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof ReleaseAvatar>

function Sample({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={2} style={{textAlign: 'center', minWidth: 130}}>
      <Flex justify="center">{children}</Flex>
      <Text size={0} muted>
        {label}
      </Text>
    </Stack>
  )
}

export const ByReleaseType: Story = {
  name: 'One glyph per release type',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The `releaseType` form: the plain mapping, with no document behind it. Bolt for asap, clock for scheduled, dot for undecided, each in its type tone. This is what a menu shows before a release exists - the type picker in the create dialog, for instance.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      {RELEASE_TYPES.map((releaseType) => (
        <Sample key={releaseType} label={releaseType}>
          <ReleaseAvatar releaseType={releaseType} fontSize={2} />
        </Sample>
      ))}
    </Flex>
  ),
}

export const ByRelease: Story = {
  name: 'Reading a real release document',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The `release` form, over the upstream release fixtures. Two rows here are the reason this form exists and the type form is not enough. **Archived** was a scheduled release and still renders a clock, but the tone collapses to default: an archived release has no urgency left to signal. **Scheduled draft** is a single-document release (`cardinality: one`) with an intended publish date, and `isPausedCardinalityOneRelease` forces a caution-toned clock - a state you cannot reach through `releaseType` at all.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      {Object.entries(releaseFixtures).map(([key, release]) => (
        <Sample key={key} label={key}>
          <ReleaseAvatar release={release} fontSize={2} />
        </Sample>
      ))}
    </Flex>
  ),
}

export const SystemPerspectives: Story = {
  name: 'Drafts and published',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The two system perspectives are not releases, but they sit in the same menu and so need the same glyph. Drafts is special-cased to caution (it is the one perspective with unpublished work in it); published is positive. Both render the neutral dot, because neither has a schedule.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      <Sample label="drafts">
        <ReleaseAvatar release="drafts" fontSize={2} />
      </Sample>
      <Sample label="published">
        <ReleaseAvatar release="published" fontSize={2} />
      </Sample>
    </Flex>
  ),
}

export const ToneOverride: Story = {
  name: 'The deprecated tone form',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Passing `tone` directly bypasses every rule above: you always get a dot, in whatever colour you asked for. It is deprecated for exactly that reason - the caller has to know the semantics the component was built to hold. Kept here because call sites still exist, and because it makes the tone palette itself legible.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      {TONES.map((tone) => (
        <Sample key={tone} label={tone}>
          {/* oxlint-disable-next-line no-deprecated -- demonstrating the full generic-tone sweep; the deprecated tone variant is still a real, supported code path in ReleaseAvatar's own prop union */}
          <ReleaseAvatar tone={tone} fontSize={2} />
        </Sample>
      ))}
    </Flex>
  ),
}

export const Sizing: Story = {
  name: 'Size and padding',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The glyph scales with `fontSize` (it renders inside `<Text>`); `padding` controls the box around it. Real call sites run small: the version chips in a document header use the default `fontSize={1}` with `padding={2}`, the perspective menu goes smaller still.',
      },
    },
  },
  render: () => (
    <Flex gap={4} align="center" wrap="wrap">
      {[0, 1, 2, 3, 4].map((fontSize) => (
        <Sample key={fontSize} label={`fontSize ${fontSize}`}>
          <ReleaseAvatar release={releaseFixtures.scheduled} fontSize={fontSize} padding={2} />
        </Sample>
      ))}
    </Flex>
  ),
}

export const InContext: Story = {
  name: 'In context - the perspective menu',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Where an editor actually meets it: a list of releases to switch the studio into, each led by its avatar. The glyph is doing real work here - it is the only thing distinguishing "publishes immediately" from "publishes Thursday" at a glance, before you read a word.',
      },
    },
  },
  render: () => (
    <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 320}}>
      <Stack gap={1}>
        {[
          releaseFixtures.asap,
          releaseFixtures.scheduled,
          releaseFixtures.undecided,
          releaseFixtures.scheduledDraft,
        ].map((release) => (
          <Card key={release._id} radius={2} padding={1} tone="transparent">
            <Flex align="center" gap={1}>
              <ReleaseAvatar release={release} />
              <Text size={1}>{release.metadata.title}</Text>
            </Flex>
          </Card>
        ))}
      </Stack>
    </Card>
  ),
}

/**
 * `ReleaseAvatarIcon` is the same resolution logic without the `Box`/`Text` wrapper, for
 * callers that supply their own. Storied alongside rather than separately: it is the same
 * component with the padding taken off.
 */
export const BareIcon: Story = {
  name: 'ReleaseAvatarIcon - unwrapped',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The inner icon on its own, for call sites that do their own layout. It carries the same `data-testid` and the same `--card-icon-color` custom property, but nothing sizes it - so like every icon in Studio it must be nested in a `<Text>` for the tone variable to resolve.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      {RELEASE_TYPES.map((releaseType) => (
        <Sample key={releaseType} label={releaseType}>
          <Text size={3}>
            <ReleaseAvatarIcon releaseType={releaseType} />
          </Text>
        </Sample>
      ))}
    </Flex>
  ),
}
