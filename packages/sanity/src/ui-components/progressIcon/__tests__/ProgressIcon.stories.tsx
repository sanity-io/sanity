import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Text, Flex, Icon, VStack} from 'ui5'

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
const MARGINS = ['-0.3125rem', '-0.375rem', '-0.4375rem', '-0.5rem', '-0.5625rem'] as const

/**
 * The sweep from empty to full, the text-size ladder, and the in-context
 * treatment from its call site. Note the known limitation at exactly
 * `progress={1}`: a 360° sweep has coincident start and end points, and an SVG
 * elliptical arc between coincident points draws nothing, so the fill
 * collapses to a sliver instead of a full disc.
 */
export const AllVariants: Story = {
  render: () => (
    <Flex gap={5} padding={4} flexDirection="column">
      <Flex alignItems="center" gap={4}>
        {FRACTIONS.map((progress) => (
          <VStack gap={2} key={progress} style={{textAlign: 'center', alignItems: 'center'}}>
            <Icon
              size={4}
              muted
              icon={<ProgressIcon progress={progress} />}
              style={{margin: MARGINS[4]}}
            />
            <Text muted size={1} as="div" trim={true}>
              {progress}
            </Text>
          </VStack>
        ))}
      </Flex>
      <Flex alignItems="center" gap={4}>
        {SIZES.map((size) => (
          <VStack gap={2} key={size} style={{textAlign: 'center', alignItems: 'center'}}>
            <Icon
              size={size}
              muted
              icon={<ProgressIcon progress={0.66} />}
              style={{margin: MARGINS[size]}}
            />
            <Text muted size={1} as="div" trim={true}>
              size {size}
            </Text>
          </VStack>
        ))}
      </Flex>
      <Flex>
        <Card padding={2} radius="full" tone="primary">
          <Flex alignItems="center" gap={2}>
            <Icon
              size={1}
              muted
              icon={<ProgressIcon progress={0.4} />}
              style={{color: 'var(--card-icon-color)', margin: MARGINS[1]}}
            />
            <Text size={1} as="div" trim={true} style={{color: 'var(--card-fg-color)'}}>
              Validating 4 / 10
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  ),
}
