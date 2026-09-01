import {UsersIcon} from '@sanity/icons/Users'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Flex} from 'ui5'

import {ConditionOptionCard} from '../ConditionOptionCard'

const meta = {
  title: 'Variants/Condition Option Card',
  component: ConditionOptionCard,
} satisfies Meta<typeof ConditionOptionCard>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {
    title: 'Audience',
    onClick: () => undefined,
  },
  render: () => (
    <Card padding={4}>
      <Stack gap={4} style={{maxWidth: 360}}>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            default
          </Text>
          <ConditionOptionCard onClick={() => undefined} title="en-US" />
        </Stack>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            with description
          </Text>
          <ConditionOptionCard
            description="Who this content is for."
            icon={UsersIcon}
            onClick={() => undefined}
            title="Audience"
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            selected
          </Text>
          <Flex>
            <ConditionOptionCard
              icon={UsersIcon}
              onClick={() => undefined}
              selected
              title="Audience"
            />
          </Flex>
        </Stack>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            invalid
          </Text>
          <ConditionOptionCard
            invalid
            onClick={() => undefined}
            selected
            title="legacy"
            description="This condition is no longer configured."
          />
        </Stack>
      </Stack>
    </Card>
  ),
}
