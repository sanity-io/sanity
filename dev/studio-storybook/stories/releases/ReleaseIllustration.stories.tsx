import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseIllustration} from '../../../../packages/sanity/src/core/releases/tool/resources/ReleaseIllustration'

const meta: Meta<typeof ReleaseIllustration> = {
  title: 'Releases/Release Illustration',
  component: ReleaseIllustration,
  parameters: {
    docs: {
      description: {
        component: [
          'This illustration is a participant in the theme rather than a picture pasted on top ' +
            'of it: drop it inside a caution-toned card and it picks up the caution palette, ' +
            'because it reads the same custom properties the card sets.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/resources/ReleaseIllustration.tsx` |',
          '| Tier | CHROME |',
          '',
          'The drawing at the top of every empty Releases screen: stacked, receding panels ' +
            'standing in for a set of documents moving together. An inline SVG with no props. It ' +
            'appears in three places: the releases empty state, the scheduled-drafts empty state, ' +
            'and both halves of the schedules upsell.',
          '',
          'The stacked-panel motif is reused (not shared) by `VariantIllustration`, which draws ' +
            'the same idea for a different primitive.',
          '',
          '> **Why it matters:** the fills and strokes are theme custom properties, not hex ' +
            'values, so the illustration is theme-aware and tone-aware in the same move. That is ' +
            'why an empty state can restyle itself for an upsell without shipping a second file.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:releases', 'chapter:cms', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof ReleaseIllustration>

export const Default: Story = {
  name: 'The illustration',
  parameters: {
    docs: {
      description: {
        story:
          'At its natural 248x201. Toggle the storybook theme and watch it follow: nothing about the markup changes, only the custom properties it reads.',
      },
    },
  },
}

export const AcrossTones: Story = {
  name: 'Following the surrounding tone',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The same component in five differently-toned cards. Nothing is passed to it - each Card sets `--card-muted-*` for its subtree and the SVG reads whatever it finds. This is why the schedules upsell can render it inside a promotional panel and have it look designed for that panel.',
      },
    },
  },
  render: () => (
    <Flex gap={3} wrap="wrap">
      {(['default', 'transparent', 'primary', 'caution', 'positive'] as const).map((tone) => (
        <Stack key={tone} gap={3}>
          <Card border radius={2} padding={3} tone={tone}>
            <div style={{width: 160}}>
              <ReleaseIllustration />
            </div>
          </Card>
          <Text size={0} muted align="center">
            {tone}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

export const InContext: Story = {
  name: 'In context - the releases empty state',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The composition it was drawn for: illustration, a heading, a sentence, and the one action worth taking. The illustration is carrying tone rather than information here - it makes an empty screen read as "nothing yet" instead of "something failed", which is the distinction empty states most often get wrong.',
      },
    },
  },
  render: () => (
    <Container width={0}>
      <Card border radius={2} padding={4}>
        <Stack gap={5}>
          <Flex justify="center">
            <ReleaseIllustration />
          </Flex>
          <Stack gap={4}>
            <Text align="center" size={2} weight="semibold">
              No releases yet
            </Text>
            <Text align="center" size={1} muted>
              Group documents that should go live together, then publish them in one move.
            </Text>
          </Stack>
        </Stack>
      </Card>
    </Container>
  ),
}
