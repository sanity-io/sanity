import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

import {LoadingBlock} from '../../../../packages/sanity/src/core/components/loadingBlock/LoadingBlock'
// Real components from real source paths (org contract §8): the generic loading
// container, and the preview layout whose built-in skeleton is the recommended
// replacement for it in list regions.
import {DefaultPreview} from '../../../../packages/sanity/src/core/components/previews/general/DefaultPreview'
import {fixtureDocuments} from '../../lib/mockDocumentPreviewStore'

const sampleRows = fixtureDocuments
  .filter((doc) => doc._type === 'author' && !doc._id.startsWith('drafts.'))
  .map((doc) => ({id: doc._id, title: doc.name as string, subtitle: doc.era as string}))

/** A fixed-size relative box, so `fill` (absolutely positioned) has somewhere to fill. */
function Region(props: {children: ReactNode; height?: number}) {
  return (
    <Card
      border
      radius={2}
      style={{position: 'relative', height: props.height ?? 160}}
      tone="transparent"
    >
      {props.children}
    </Card>
  )
}

const meta: Meta<typeof LoadingBlock> = {
  title: 'Lists & Data/LoadingBlock',
  component: LoadingBlock,
  args: {fill: false, showText: false},
  argTypes: {
    fill: {control: 'boolean'},
    showText: {control: 'boolean'},
    title: {control: 'text'},
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'There is always a gap between asking for data and getting it, and something has to ' +
            "sit in that gap. This is Studio's simplest answer: a centred spinner, an optional " +
            'delayed label, and no knowledge of what it is waiting for. It is honest and it is ' +
            'everywhere, though for list and pane regions a layout-shaped skeleton usually serves ' +
            'an editor better than a spinner over a blank frame.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/loadingBlock/LoadingBlock.tsx`, Studio-only (no DS equivalent) |',
          '| Tier | CHROME. A pure loading-presentation atom: a centred `@sanity/ui` `Spinner` with optional delayed text, no domain logic and no knowledge of what it is waiting for |',
          "| Audit | 🔴 needs-work (`skeleton-vs-spinner`, `instant-gratification`, `progress-indicator`). This is the bare spinner the audit found flashing over blank panes on reload. It gives no shape to what is loading; for list and pane regions the recommended direction is a layout-matched skeleton (the previews' `isPlaceholder` mode) instead |",
          '| Timing | invisible for the first 750ms, then fades in; optional text appears after 2000ms |',
          '| Patterns | `skeleton-vs-spinner` · `instant-gratification` · `progress-indicator` |',
          '',
          'Timing is deliberate: the spinner is invisible for its first 750ms and then fades in ' +
            '(so a fast load never flashes a spinner), and the optional text only appears after ' +
            '2000ms. In a static story that means the frame starts empty and the spinner arrives ' +
            'a beat later, that is the component working, not a broken story. `fill` ' +
            'absolutely-positions the block to cover a `position: relative` parent (used for pane ' +
            'overlays); without `fill` it stretches to fill its flow container with a 75px floor.',
          '',
          'Harness notes: prop-driven, no store or provider stack (only the global i18n ' +
            'decorator, which supplies the "Loading" fallback string). The Current/Recommended ' +
            'pair reuses the shared fixture authors (`lib/mockDocumentPreviewStore.ts`) to show ' +
            'the same region as a spinner versus as skeleton previews.',
          '',
          '> **Why it matters:** the delays are deliberate anti-flash timing. Nothing paints ' +
            'for the first 750ms and the label waits 2000ms, so a fast load never flashes a ' +
            'spinner at all. When a story frame starts empty and the spinner appears a beat ' +
            'later, that is the anti-flash timing doing its job.',
          '',
          'The page closes **in context**: opening the "Anna Karenina" book. The pane chrome ' +
            'paints instantly while LoadingBlock fills the body until the document resolves.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:lists',
    'chapter:nav',
    'chapter:people',
    'pattern:skeleton-vs-spinner',
    'pattern:instant-gratification',
    'pattern:progress-indicator',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof LoadingBlock>

/**
 * Default: a bare spinner. It fades in after ~750 ms (give it a moment), then spins with
 * no text. This is the exact state the audit flagged when it fills an empty list pane.
 */
export const Default: Story = {
  render: (args) => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Region>
        <LoadingBlock {...args} />
      </Region>
    </Box>
  ),
}

/** With text: the spinner slides up and a "Loading" label fades in after ~2000 ms. */
export const WithText: Story = {
  args: {showText: true},
  render: (args) => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Region>
        <LoadingBlock {...args} />
      </Region>
    </Box>
  ),
}

/** Custom title: any text may replace the default "Loading" (avoid trailing ellipses). */
export const CustomText: Story = {
  args: {showText: true, title: 'Fetching documents'},
  render: (args) => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Region>
        <LoadingBlock {...args} />
      </Region>
    </Box>
  ),
}

/**
 * `fill` mode: the block absolutely covers its `position: relative` parent, the way a
 * pane overlays its content region while resolving. Here the parent is the bordered box.
 */
export const Fill: Story = {
  args: {fill: true, showText: true, title: 'Loading document'},
  parameters: {controls: {include: []}},
  render: (args) => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Region height={220}>
        <LoadingBlock {...args} />
      </Region>
    </Box>
  ),
}

/**
 * **Current (audit finding).** `skeleton-vs-spinner` / `instant-gratification`: a list
 * region rendered as a `LoadingBlock`: one spinner centred on a blank panel. Nothing
 * about the destination layout survives; on the dark theme it is a spinner flashing on
 * an empty pane.
 */
export const Current: Story = {
  name: 'List region · Current (spinner)',
  tags: ['audit:needs-work'],
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Card border radius={2} overflow="hidden">
        <Flex
          align="center"
          justify="space-between"
          padding={2}
          style={{borderBottom: '1px solid var(--card-border-color)'}}
        >
          <Text size={1} weight="medium">
            Documents
          </Text>
        </Flex>
        <Box style={{position: 'relative', height: 216}}>
          <LoadingBlock fill />
        </Box>
      </Card>
    </Box>
  ),
}

/**
 * **Recommended.** The same region as skeleton previews: the list's own `DefaultPreview`
 * rows in their `isPlaceholder` mode. The count, geometry and rhythm of the final list
 * are visible immediately, so content swaps in place with no blank frame and no reflow.
 * The spinner is not replaced with a fancier spinner; it is replaced with the shape of
 * the answer.
 */
export const Recommended: Story = {
  name: 'List region · Recommended (skeleton previews)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Card border radius={2} overflow="hidden">
        <Flex
          align="center"
          justify="space-between"
          padding={2}
          style={{borderBottom: '1px solid var(--card-border-color)'}}
        >
          <Text size={1} weight="medium">
            Documents
          </Text>
        </Flex>
        <Stack gap={0}>
          {sampleRows.map((row) => (
            <Card key={row.id} borderBottom padding={1}>
              <DefaultPreview media={<Box />} isPlaceholder />
            </Card>
          ))}
        </Stack>
      </Card>
    </Box>
  ),
}

/**
 * In context: opening the "Anna Karenina" book. The pane chrome (its title and
 * type) paints instantly, and LoadingBlock fills the body while the document
 * resolves. This is the component doing its actual job: a `fill` overlay over a
 * `position: relative` content region. Give it the ~750 ms of deliberate quiet
 * before the spinner fades in, a fast open never flashes it at all.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Box padding={4} style={{maxWidth: 360}}>
      <Card border radius={2} overflow="hidden">
        <Flex
          align="center"
          justify="space-between"
          padding={3}
          style={{borderBottom: '1px solid var(--card-border-color)'}}
        >
          <Stack gap={2}>
            <Text size={1} weight="semibold">
              Anna Karenina
            </Text>
            <Text size={0} muted>
              Book · Draft
            </Text>
          </Stack>
        </Flex>
        <Box style={{position: 'relative', height: 216}}>
          <LoadingBlock fill showText title="Loading document" />
        </Box>
      </Card>
    </Box>
  ),
}
