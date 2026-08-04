import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// ProgressIcon is NOT re-exported from the `sanity` ui-components barrel, so the
// source file is the only way in; these stories are the only place it renders
// standalone. NOTE on the prop: the JSDoc in the source says `progress` is a
// "percentage (0-100)", but the math (`progress * 360`) and its sole call site
// (`validatedCount / totalCount` in ValidationProgressIndicator) prove it is a
// 0→1 fraction. These stories use the 0→1 fraction the code actually expects.
import {ProgressIcon} from '../../../../packages/sanity/src/ui-components/progressIcon/ProgressIcon'

const meta: Meta<typeof ProgressIcon> = {
  title: 'Lists & Data/ProgressIcon',
  component: ProgressIcon,
  args: {progress: 0.5},
  argTypes: {
    progress: {control: {type: 'range', min: 0, max: 1, step: 0.05}},
  },
  // Nest in <Text> like the call site: ProgressIcon is 1em/currentColor, so the
  // enclosing Text controls both its size and its color.
  render: (props) => (
    <Text size={4}>
      <ProgressIcon {...props} />
    </Text>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'ProgressIcon is a determinate progress indicator: when the total is known, a filling ' +
            'arc says exactly how much is done, not just that something is happening.',
          '',
          '|          |                                                                                                                                                                                                                                           |',
          '| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/ui-components/progressIcon/ProgressIcon.tsx`, Studio-only (no DS equivalent)                                                                                                                                         |',
          '| Tier     | CHROME. A stateless SVG primitive: it draws a determinate progress arc from a single number, no domain logic                                                                                                                              |',
          '| Audit    | 🟢 holds (`progress-indicator`). A correct determinate indicator. The adjacent `spinners-loading` negative in the audit lives on the Delete/Unpublish confirm Dialog (stuck on "Looking for referring documents…"), not on this component |',
          '| Patterns | `progress-indicator` · `spinners-loading`                                                                                                                                                                                                 |',
          '',
          'Renders a pie-style fill that sweeps clockwise from 12 o’clock as `progress` goes ' +
            'from `0` to `1`, sized at `1em` and inheriting `currentColor`, so it scales and ' +
            'tints with the enclosing `<Text>`. It is the determinate counterpart to `@sanity/ui` ' +
            '`Spinner`; Studio uses it in `ValidationProgressIndicator` to show validation ' +
            'completing across a Release. Prefer it over an indeterminate spinner whenever the ' +
            'total is known (`done / total`), per the `progress-indicator` pattern.',
          '',
          "> **Why it matters:** the source's own JSDoc comment is wrong. It calls the prop a " +
            'percentage from 0 to 100, but the implementation treats it as a fraction from 0 to ' +
            '1. Passing 50 instead of 0.5 renders as a barely visible sliver, not half the ' +
            'circle.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:nav',
    'chapter:actions',
    'pattern:progress-indicator',
    'pattern:spinners-loading',
    'audit:holds',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof ProgressIcon>

/** Playground: drag `progress` (0 to 1) in the controls. */
export const Default: Story = {}

/**
 * The full sweep from empty to full, as a 0→1 fraction.
 *
 * ⚠️ Live finding at `progress={1}`: the fill collapses to a thin sliver (looks
 * like a “!”) instead of a full disc. The arc math sends `partialCircle` a 360°
 * sweep whose start and end points are identical, and an SVG elliptical arc
 * between two coincident points draws nothing, the classic full-circle
 * degenerate-arc case. Only the base ring outline plus the `L 12.5 12.5 Z` spoke
 * remain. This is a component limitation (real call sites can reach exactly 1.0
 * when `done === total`), left un-patched here per scope; documented for the
 * component owner.
 */
export const Sweep: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      {[0, 0.25, 0.5, 0.75, 1].map((progress) => (
        <Stack key={progress} gap={2} style={{textAlign: 'center'}}>
          <Text size={4}>
            <ProgressIcon progress={progress} />
          </Text>
          <Text size={1} muted>
            {progress}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/**
 * 1em sizing: the glyph tracks the enclosing Text size. The Sanity UI text scale
 * is 0-indexed with valid sizes 0–4 (iconSize 17/21/25/29/33). Requesting size 5
 * is out of range: Sanity UI falls back to its default (size 2, iconSize 25),
 * which renders *smaller* than size 4 and breaks the monotonic ladder. So this
 * story walks 0→4, the real range.
 */
export const Sizes: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      {([0, 1, 2, 3, 4] as const).map((size) => (
        <Stack key={size} gap={2} style={{textAlign: 'center'}}>
          <Text size={size}>
            <ProgressIcon progress={0.66} />
          </Text>
          <Text size={1} muted>
            size {size}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/**
 * In context, matching the real call sites: inside a toned Card + Text
 * (ValidationProgressIndicator) and inside a Button.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      <Card padding={2} radius="full" tone="primary">
        <Flex gap={2} align="center">
          <Text size={1}>
            <ProgressIcon progress={0.4} />
          </Text>
          <Text size={1}>Validating 4 / 10</Text>
        </Flex>
      </Card>
      <Button mode="ghost" text="Publishing…" icon={() => <ProgressIcon progress={0.8} />} />
    </Flex>
  ),
}
