import {Box, Card, Container, Flex, Grid, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PxCaption, SchemeCompare} from '../../lib/matrixBuilder'

const meta: Meta = {
  title: 'UI v3 Primitives/Layout',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every pane, dialog, and field in Studio is built from one of these seven atoms, and their ' +
            'gaps and radii are never eyeballed: each is an index-based token that resolves to a fixed ' +
            'pixel value, so reading a ladder turns spacing into a deliberate measurement.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `@sanity/ui` primitives: the raw padded block (`Box`), the toned surface (`Card`), and the four arrangers (`Flex`, `Stack`, `Inline`, `Grid`), plus the reading-width cap (`Container`) |',
          '| Tier | ATOM. Consumed by the structure of every pane, dialog, and field: a `Stack` spaces a form vertically, a `Flex` lays a toolbar horizontally, a `Card` tones a field critical on error, a `Container` holds the document form to a legible measure |',
          '| Audit | ⚪ not-audited as a unit; instances inherit whatever the consuming component’s audit found |',
          '| Patterns | `layout` |',
          '| Scale | space 0/4/8/12/20/32/52/84/136/220px · radius 0/1/3/6/9/12/21px |',
          '',
          'Reading the ladder is how a `gap={3}` becomes a deliberate 12px rather than a guess.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:foundations', 'pattern:layout', 'source:sanity-ui', 'tier:atom'],
}

export default meta
type Story = StoryObj

// Card tones (theme/system/color THEME_COLOR_CARD_TONES), minus the deprecated `primary`.
const CARD_TONES = [
  'default',
  'transparent',
  'neutral',
  'suggest',
  'positive',
  'caution',
  'critical',
] as const

/**
 * `Card` reads across every tone in both schemes, the single most useful matrix in the set,
 * because tone is how Studio colors meaning onto a surface: a `critical` card is the error field,
 * a `caution` card the unpublished banner, a `positive` card the success state. Seeing all seven
 * side by side in light and dark is the fastest way to confirm a tone choice.
 */
export const CardTones: Story = {
  name: 'Card · tone × scheme',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={3}>
          {CARD_TONES.map((tone) => (
            <Card key={tone} tone={tone} padding={3} radius={2} border style={{minWidth: 220}}>
              <Text size={1}>tone=&quot;{tone}&quot;</Text>
            </Card>
          ))}
        </Stack>
      )}
    />
  ),
}

// Space scale (theme/defaults/config.ts space), index to pixels.
const SPACE_PX = [0, 4, 8, 12, 20, 32, 52, 84, 136, 220]

/**
 * The space scale, shown as the gap between two blocks. Studio leans on the low end: `gap={2}`
 * (8px) inside dense controls, `gap={3}` (12px) between form fields, `gap={4}` (20px) between
 * field groups. The ladder labels each so the rhythm is a decision.
 */
export const SpaceScale: Story = {
  name: 'Space scale',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={4}>
          {SPACE_PX.slice(0, 7).map((px, space) => (
            <Flex key={px} align="center" gap={4}>
              <Box style={{width: 72}}>
                <PxCaption label={`space ${space}`} px={px} />
              </Box>
              <Flex gap={space}>
                <Card tone="suggest" padding={2} radius={1} style={{width: 24, height: 24}} />
                <Card tone="suggest" padding={2} radius={1} style={{width: 24, height: 24}} />
              </Flex>
            </Flex>
          ))}
        </Stack>
      )}
    />
  ),
}

// Radius scale (theme/defaults/config.ts radius), index to pixels.
const RADIUS_PX = [0, 1, 3, 6, 9, 12, 21]

/**
 * The radius scale on a `Card`. Studio uses `radius={1}` (3px) for inputs and `radius={2}` (6px)
 * for panels; `full` (the pill) is reserved for badges and avatars.
 */
export const RadiusScale: Story = {
  name: 'Radius scale',
  render: () => (
    <SchemeCompare
      render={() => (
        <Flex gap={4} wrap="wrap">
          {RADIUS_PX.map((px, radius) => (
            <Stack key={px} gap={3} style={{alignItems: 'center'}}>
              <Card tone="suggest" radius={radius} border style={{width: 56, height: 56}} />
              <PxCaption label={`radius ${radius}`} px={px} />
            </Stack>
          ))}
        </Flex>
      )}
    />
  ),
}

const swatch = (n: number) => (
  <Card key={n} tone="suggest" padding={3} radius={1}>
    <Text size={1}>{n}</Text>
  </Card>
)

/**
 * The four arrangers, each doing its one job. `Stack` spaces children vertically, `Inline`
 * horizontally (wrapping), `Flex` gives full control of an axis, and `Grid` places on a
 * two-dimensional track. Studio composes forms from `Stack` and toolbars from `Flex`.
 */
export const Arrangers: Story = {
  name: 'Stack · Inline · Flex · Grid',
  render: () => {
    return (
      <SchemeCompare
        render={() => (
          <Stack gap={5}>
            <Stack gap={2}>
              <Text size={0} muted weight="semibold">
                Stack (vertical)
              </Text>
              <Stack gap={2}>{[1, 2, 3].map(swatch)}</Stack>
            </Stack>
            <Stack gap={2}>
              <Text size={0} muted weight="semibold">
                Inline (horizontal, wraps)
              </Text>
              <Inline gap={2}>{[1, 2, 3, 4].map(swatch)}</Inline>
            </Stack>
            <Stack gap={2}>
              <Text size={0} muted weight="semibold">
                Flex (space-between)
              </Text>
              <Flex gap={2} justify="space-between">
                {[1, 2, 3].map(swatch)}
              </Flex>
            </Stack>
            <Stack gap={2}>
              <Text size={0} muted weight="semibold">
                Grid (3 columns)
              </Text>
              <Grid gridTemplateColumns={3} gap={2}>
                {[1, 2, 3, 4, 5, 6].map(swatch)}
              </Grid>
            </Stack>
          </Stack>
        )}
      />
    )
  },
}

/**
 * `Container` caps content to a reading width, the atom that keeps a document form from spanning
 * a wide viewport. `width={1}` is the narrow form measure; the box below shows it centered inside
 * a wider frame.
 */
export const ContainerWidth: Story = {
  name: 'Container · reading width',
  render: () => (
    <SchemeCompare
      render={() => (
        <Box padding={4} style={{width: 640}}>
          <Container width={1}>
            <Card tone="suggest" padding={4} radius={2} border>
              <Text size={1}>Container width=1, capped and centered in a 640px frame</Text>
            </Card>
          </Container>
        </Box>
      )}
    />
  ),
}
