import {Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {BetaBadge} from '../BetaBadge'

const LABELS = ['Beta', 'Alpha', 'New', 'Experimental']
const FONT_SIZES = [0, 1, 2, 3]

/**
 * The marker for a feature that has shipped but is not yet stable. A
 * `@sanity/ui` `Badge` with `tone="primary"` and `radius={2}` locked in and
 * `children` defaulting to "Beta"; `tone` and `mode` are deliberately omitted
 * from its props so every experimental marker in the studio looks the same.
 * `fontSize` is the only dial.
 */
const meta = {
  title: 'Core Components/Beta Badge',
  component: BetaBadge,
  args: {fontSize: 1},
} satisfies Meta<typeof BetaBadge>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The default label, alternate labels, the font-size scale, and the badge
 * trailing a feature name as it appears in navigation and headers.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5} padding={4}>
      <Flex align="center" gap={3}>
        {LABELS.map((label) => (
          <BetaBadge key={label}>{label}</BetaBadge>
        ))}
      </Flex>
      <Flex align="center" gap={3}>
        {FONT_SIZES.map((fontSize) => (
          <Stack gap={3} key={fontSize} style={{textAlign: 'center'}}>
            <BetaBadge fontSize={fontSize} />
            <Text muted size={0}>
              fontSize {fontSize}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 320}}>
        <Inline gap={2}>
          <Text size={1} weight="medium">
            Content Releases
          </Text>
          <BetaBadge />
        </Inline>
      </Card>
    </Stack>
  ),
}
