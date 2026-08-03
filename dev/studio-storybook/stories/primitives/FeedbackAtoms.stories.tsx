import {Card, Flex, Skeleton, Spinner, Stack, Text, TextSkeleton} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PxCaption, SchemeCompare} from '../../lib/matrixBuilder'

const meta: Meta = {
  title: 'UI v3 Primitives/Feedback',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A pane that waits on data has to say so without lying about the shape of what is coming, ' +
            'and these two atoms are how Studio does it: an indeterminate spinner when there is no ' +
            'progress to report, a shimmer placeholder when there is a layout worth holding still.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `@sanity/ui` primitives: the activity spinner (`Spinner`) and the skeleton placeholders (`Skeleton`, `TextSkeleton`) |',
          '| Tier | ATOM. Consumed by any pane that waits on data: a document list shows `TextSkeleton` rows before a query resolves, a preview shows a `Skeleton` block for its media, a busy action shows a `Spinner` |',
          '| Audit | ⚪ not-audited as a unit; instances inherit whatever the consuming component’s audit found |',
          '| Patterns | `spinners-loading` |',
          '',
          'Reach for `Spinner` only when the total is unknown; once you know `done / total`, the ' +
            'determinate `ProgressIcon` (Lists & Data) tells the reader more. A skeleton should match ' +
            'the real content box it stands in for, so the layout does not shift when the data lands.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:foundations',
    'pattern:spinners-loading',
    'source:sanity-ui',
    'tier:atom',
  ],
}

export default meta
type Story = StoryObj

// Spinner size maps to the text scale's icon sizes (theme fonts iconSize), in pixels.
const SPINNER_PX = [17, 21, 25, 29, 33]

/**
 * `Spinner` across the size scale, in default and muted. The muted variant lowers contrast for a
 * spinner that sits inside already-busy chrome (a loading button, a small inline hint); the
 * default is for a spinner that is the only thing on screen.
 */
export const SpinnerScale: Story = {
  name: 'Spinner · sizes',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={5}>
          <Flex align="flex-end" gap={5}>
            {SPINNER_PX.map((px, size) => (
              <Stack key={px} gap={3} style={{alignItems: 'center'}}>
                <Text size={size}>
                  <Spinner />
                </Text>
                <PxCaption label={`size ${size}`} px={px} />
              </Stack>
            ))}
          </Flex>
          <Flex gap={5} align="center">
            <Flex gap={2} align="center">
              <Text size={2}>
                <Spinner />
              </Text>
              <Text size={1}>default</Text>
            </Flex>
            <Flex gap={2} align="center">
              <Text size={2} muted>
                <Spinner muted />
              </Text>
              <Text size={1} muted>
                muted
              </Text>
            </Flex>
          </Flex>
        </Stack>
      )}
    />
  ),
}

/**
 * `TextSkeleton` is the placeholder that holds a line of type. It takes the same `size` as the
 * `Text` it stands in for, so a skeletonized list row is exactly as tall as the loaded row and
 * the layout does not jump. Toggle `animated` for the shimmer.
 */
export const TextSkeletons: Story = {
  name: 'TextSkeleton · line placeholders',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={4} style={{minWidth: 260}}>
          <Stack gap={2}>
            <Text size={0} muted weight="semibold">
              Animated (loading)
            </Text>
            <Stack gap={3}>
              <TextSkeleton size={1} animated style={{width: '80%'}} />
              <TextSkeleton size={1} animated style={{width: '60%'}} />
              <TextSkeleton size={1} animated style={{width: '70%'}} />
            </Stack>
          </Stack>
          <Stack gap={2}>
            <Text size={0} muted weight="semibold">
              Static (placeholder, no data expected)
            </Text>
            <Stack gap={3}>
              <TextSkeleton size={1} style={{width: '80%'}} />
              <TextSkeleton size={1} style={{width: '55%'}} />
            </Stack>
          </Stack>
        </Stack>
      )}
    />
  ),
}

/**
 * `Skeleton` is the block placeholder, for non-text boxes like a preview thumbnail or media
 * frame. Give it the real dimensions of the thing it replaces. The side-by-side shows a loading
 * preview row and, beside it, the loaded result it becomes.
 */
export const SkeletonBlocks: Story = {
  name: 'Skeleton · block placeholders',
  render: () => (
    <SchemeCompare
      render={() => (
        <Flex gap={4} align="flex-start">
          <Card padding={2} radius={2} border style={{width: 200}}>
            <Flex gap={3} align="center">
              <Skeleton animated radius={2} style={{width: 48, height: 48}} />
              <Stack gap={3} flex={1}>
                <TextSkeleton size={1} animated style={{width: '90%'}} />
                <TextSkeleton size={0} animated style={{width: '60%'}} />
              </Stack>
            </Flex>
          </Card>
          <Card padding={2} radius={2} border style={{width: 200}}>
            <Flex gap={3} align="center">
              <Card tone="suggest" radius={2} style={{width: 48, height: 48}} />
              <Stack gap={2} flex={1}>
                <Text size={1} weight="medium">
                  Loaded title
                </Text>
                <Text size={0} muted>
                  Subtitle
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Flex>
      )}
    />
  ),
}
