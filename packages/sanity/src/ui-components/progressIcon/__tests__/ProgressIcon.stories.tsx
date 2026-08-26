import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ProgressIcon} from '../ProgressIcon'

/**
 * A determinate progress indicator: when the total is known, a filling arc
 * says exactly how much is done, not just that something is happening. The
 * pie-style fill sweeps clockwise from 12 o'clock as `progress` goes from `0`
 * to `1` (a fraction, not a percentage). Sized at `1em` and drawn in
 * `currentColor`, it scales and tints with the enclosing `Text` — the studio
 * uses it in `ValidationProgressIndicator` to show validation completing
 * across a release.
 */
const meta = {
  title: 'UI Components/Progress Icon',
  component: ProgressIcon,
  args: {progress: 0.5},
} satisfies Meta<typeof ProgressIcon>

export default meta
type Story = StoryObj<typeof meta>

const FRACTIONS = [0, 0.25, 0.5, 0.75, 1]
const SIZES = [0, 1, 2, 3, 4] as const

/**
 * The sweep from empty to full, the text-size ladder, and the in-context
 * treatment from its call site. Note the known limitation at exactly
 * `progress={1}`: a 360° sweep has coincident start and end points, and an SVG
 * elliptical arc between coincident points draws nothing, so the fill
 * collapses to a sliver instead of a full disc.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5} padding={4}>
      <Flex align="center" gap={4}>
        {FRACTIONS.map((progress) => (
          <Stack gap={2} key={progress} style={{textAlign: 'center'}}>
            <Text size={4}>
              <ProgressIcon progress={progress} />
            </Text>
            <Text muted size={1}>
              {progress}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Flex align="center" gap={4}>
        {SIZES.map((size) => (
          <Stack gap={2} key={size} style={{textAlign: 'center'}}>
            <Text size={size}>
              <ProgressIcon progress={0.66} />
            </Text>
            <Text muted size={1}>
              size {size}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Flex>
        <Card padding={2} radius="full" tone="primary">
          <Flex align="center" gap={2}>
            <Text size={1}>
              <ProgressIcon progress={0.4} />
            </Text>
            <Text size={1}>Validating 4 / 10</Text>
          </Flex>
        </Card>
      </Flex>
    </Stack>
  ),
}
