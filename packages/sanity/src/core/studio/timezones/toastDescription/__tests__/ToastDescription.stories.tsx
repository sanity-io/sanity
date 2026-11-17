import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {VStack} from 'ui5'

import ToastDescription from '../ToastDescription'

/**
 * Chromatic sentinel for the time zone toast body: calendar icon inline with
 * the semibold title, and the optional smaller body line below. Copy is a
 * fixture (the real toast formats the selected time zone name).
 */
const meta = {
  title: 'Studio/Time Zone Toast Description',
  component: ToastDescription,
  args: {title: 'Time zone updated'},
} satisfies Meta<typeof ToastDescription>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: () => (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            title and body
          </Text>
          <Card border padding={3} radius={3}>
            <ToastDescription
              title="Time zone updated"
              body="Scheduled publishing times now display in Europe/Oslo (GMT+1)."
            />
          </Card>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            title only
          </Text>
          <Card border padding={3} radius={3}>
            <ToastDescription title="Time zone updated" />
          </Card>
        </VStack>
      </VStack>
    </Card>
  ),
}
