import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {css, styled} from 'styled-components'

// `@sanity/color` is not a direct dep of the studio-storybook workspace, so a bare
// specifier fails Rolldown resolution; reach it through the sanity package's own copy,
// the same deep-path pattern the Foundations/Design Tokens story uses.
import {hues} from '../../../../packages/sanity/node_modules/@sanity/color/dist/index.js'
// Real components from their real paths (org contract §8). The progress/ directory ships
// two determinate progress primitives — a circular SVG ring and a translating linear bar
// — both driven by a single `value` percentage (0–100), both clamped. Pure presentation,
// no provider stack.
import {CircularProgress} from '../../../../packages/sanity/src/core/components/progress/CircularProgress'
import {LinearProgress} from '../../../../packages/sanity/src/core/components/progress/LinearProgress'

// A story-local rebuild of `LinearProgress`'s translate technique at a heavier 12px bar —
// used ONLY by the Thickness comparison below to show a Recommended weight beside canon.
// It mirrors the shipped component exactly (same `radius={5}`, same `overflow: clip` root,
// same blue hue + 75ms translate) except for `height`; the real component is left untouched.
const ThickRoot = styled(Card)`
  overflow: hidden;
  overflow: clip;
`
const ThickFill = styled(Card)(({theme}: {theme: Theme}) => {
  // oxlint-disable-next-line no-deprecated -- v2 color namespace not yet adopted anywhere in packages/sanity/src; v1 remains fully functional pending a real migration
  const {color} = theme.sanity
  return css`
    height: 0.75rem;
    background: ${hues.blue[color.dark ? 400 : 500].hex};
    transition: transform 75ms;
  `
})
function ThickBar(props: {value: number}) {
  const value = Math.min(Math.max(props.value, 0), 100)
  return (
    <ThickRoot radius={5}>
      <ThickFill radius={5} style={{transform: `translate3d(${value - 100}%, 0, 0)`}} />
    </ThickRoot>
  )
}

const meta: Meta = {
  title: 'Lists & Data/Progress',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Studio ships two correct determinate progress primitives that are simply not being ' +
            'reached for: the audit found panes going blank on load with no skeleton, not because ' +
            'these components are broken, but because nothing calls them there.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/progress/`, Studio-only (no DS equivalent) |',
          '| Tier | CHROME. Two value-driven determinate progress indicators. `CircularProgress` draws an SVG ring via `stroke-dashoffset`; `LinearProgress` translates a filled bar. Both take one prop, `value` (a 0-100 percentage), and both clamp out-of-range input rather than overflow |',
          '| Audit | ⚪ not-audited as units, but they are the primitives the `progress-indicator` finding points at. The defect is non-use at the pane level, not a fault in these components |',
          '| Patterns | `progress-indicator` |',
          '',
          '`CircularProgress` clamps with `Math.min(Math.max(value, 0), 100)`; `LinearProgress` translates by `value - 100%` and is clipped by an `overflow: clip` root, so 120 and -20 both render as full / empty rather than spilling. The clamping story shows both extremes.',
          '',
          '> **Why it matters:** storied here so the fix has a component to reach for. The gap the audit found, a blank content region with no skeleton, was never a defect in these primitives; it was them going unused where they were needed.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:nav',
    'pattern:progress-indicator',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

const STEPS = [0, 25, 50, 75, 100]

/** The circular ring swept across the value range. */
export const Circular: Story = {
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Flex gap={4} align="center">
        {STEPS.map((value) => (
          <Stack key={value} gap={3} style={{textAlign: 'center'}}>
            <CircularProgress value={value} />
            <Text size={0} muted>
              {value}%
            </Text>
          </Stack>
        ))}
      </Flex>
    </Card>
  ),
}

/** The linear bar swept across the same range. */
export const Linear: Story = {
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Stack gap={4} style={{minWidth: 320}}>
        {STEPS.map((value) => (
          <Stack key={value} gap={2}>
            <Flex justify="space-between">
              <Text size={0} muted>
                Uploading
              </Text>
              <Text size={0} muted>
                {value}%
              </Text>
            </Flex>
            <LinearProgress value={value} />
          </Stack>
        ))}
      </Stack>
    </Card>
  ),
}

/**
 * Thickness (taste comparison). `LinearProgress` ships an **8px** bar
 * (`STROKE_WIDTH = 0.5` → `0.5rem` in `LinearProgress.tsx`); at `radius={5}` that reads as a
 * thin pill. This pairs the as-shipped bar with a **12px** rendition so the heavier weight
 * can be judged beside canon. The 12px bar is a story-local rebuild of the same translate
 * technique. The shipped component is **not** overwritten; this is a Recommended proposal
 * for the component owner, not an override.
 */
export const Thickness: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Stack gap={4} style={{minWidth: 360}}>
        {(
          [
            {label: 'As shipped, 8px', node: <LinearProgress value={66} />},
            {label: 'Recommended, 12px (proposed)', node: <ThickBar value={66} />},
          ] as const
        ).map(({label, node}) => (
          <Stack key={label} gap={2}>
            <Text size={1} muted>
              {label}
            </Text>
            {node}
          </Stack>
        ))}
      </Stack>
    </Card>
  ),
}

/**
 * Out-of-range input is clamped, not overflowed: `120` renders as full and `-20` as
 * empty, for both primitives: a caller doing arithmetic on a byte count can't break the
 * layout.
 */
export const Clamping: Story = {
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <Stack gap={4}>
        {(
          [
            {label: 'value = -20 (→ empty)', value: -20},
            {label: 'value = 120 (→ full)', value: 120},
          ] as const
        ).map(({label, value}) => (
          <Stack key={label} gap={3}>
            <Text size={0} muted>
              {label}
            </Text>
            <Flex gap={4} align="center">
              <CircularProgress value={value} />
              <Box flex={1}>
                <LinearProgress value={value} />
              </Box>
            </Flex>
          </Stack>
        ))}
      </Stack>
    </Card>
  ),
}
