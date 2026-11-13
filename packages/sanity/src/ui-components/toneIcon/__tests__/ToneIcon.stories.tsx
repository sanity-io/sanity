import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Badge, Card} from '@sanity/ui'
import {type ThemeColorStateToneKey} from '@sanity/ui/theme'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Text, Flex, Icon} from 'ui5'

import {ToneIcon} from '../ToneIcon'

const TONES: ThemeColorStateToneKey[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * The studio's `ui-components` ToneIcon, which colors an icon via the
 * `--card-badge-*-icon-color` CSS custom properties. Tone-related coverage is
 * prioritized for the ui5 migration since these variables cascade from Card.
 */
const meta = {
  title: 'UI Components/Tone Icon',
  component: ToneIcon,
} satisfies Meta<typeof ToneIcon>

export default meta
type Story = StoryObj<typeof meta>

export const AllTones: Story = {
  args: {tone: 'default', icon: InfoOutlineIcon},
  render: () => (
    <Card padding={4}>
      <Flex gap={4}>
        {TONES.map((tone) => (
          <Flex key={tone} alignItems="center" flexDirection="column" gap={2}>
            <Badge tone={tone === 'default' ? undefined : tone}>
              <Icon
                size={1}
                icon={<ToneIcon icon={InfoOutlineIcon} tone={tone} />}
                style={{margin: '-0.375rem'}}
              />
            </Badge>
            <Text muted size={0} as="div" trim={true}>
              {tone}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  ),
}
