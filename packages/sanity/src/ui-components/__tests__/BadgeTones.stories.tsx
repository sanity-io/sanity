import {Badge, type BadgeTone, Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Flex, VStack} from 'ui5'

const TONES: BadgeTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * Tone sentinel for `@sanity/ui` Badge. Badges are nested inside cards, menus
 * and banners throughout the studio; explicit tones here catch token/radius
 * regressions the Card story's inherited (untinted) Badge would miss.
 */
const meta = {
  title: 'Sanity UI/Badge Tones',
  component: Badge,
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const AllTones: Story = {
  render: () => (
    <Card padding={4}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            fontSize 1
          </Text>
          <Flex gap={2} flexWrap="wrap">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Flex>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            fontSize 0 (menu badges)
          </Text>
          <Flex gap={2} flexWrap="wrap">
            {TONES.map((tone) => (
              <Badge key={`${tone}-sm`} fontSize={0} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Flex>
        </VStack>
      </VStack>
    </Card>
  ),
}
