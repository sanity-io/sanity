import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import ToastDescription from '../ToastDescription'

/**
 * Chromatic sentinel for the time-zone toast body after the ui5 Flex
 * migration. The calendar icon and semibold title share an Inline row above
 * an optional body line; the column gap and paddingY around them are what
 * this pins. Copy mirrors `useTimeZone`'s "Time zone updated" toast with a
 * fixture zone (no live clock, no Intl lookup).
 */
const meta = {
  title: 'Studio/Time Zone Toast Description',
  component: ToastDescription,
} satisfies Meta<typeof ToastDescription>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {title: 'Time zone updated'},
  render: () => (
    <Card padding={4} style={{maxWidth: 360}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            title and body
          </Text>
          <Card border padding={3} radius={2} tone="primary">
            <ToastDescription
              body="Central European Summer Time (Europe/Oslo)"
              title="Time zone updated"
            />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            title only
          </Text>
          <Card border padding={3} radius={2} tone="critical">
            <ToastDescription title="Unable to update time zone" />
          </Card>
        </Stack>
      </Stack>
    </Card>
  ),
}
