import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Box} from 'ui5'

import {Alert} from '../Alert'
import {AlertStrip} from '../AlertStrip'
import {Details} from '../Details'

const SUFFIX = (
  <Box padding={3}>
    <Text size={1}>Reset this field</Text>
  </Box>
)

/**
 * Chromatic sentinel for form alert primitives after the mixed ui5 Box /
 * Sanity UI Flex migration. Warning vs error tones, suffix divider, closed
 * AlertStrip, and open Details all depend on Box padding against Card tones
 * — a mix TypeScript will not catch. Copy is a fixture (no timestamps).
 */
const meta = {
  title: 'Form/Alerts',
  component: Alert,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {title: 'Incompatible value'},
  render: () => (
    <Card padding={4} style={{maxWidth: 480}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            alert warning
          </Text>
          <Alert status="warning" title="Incompatible value">
            <Text size={1}>Expected type string, got number.</Text>
          </Alert>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            alert error with suffix
          </Text>
          <Alert status="error" suffix={SUFFIX} title="Could not resolve value">
            <Text size={1}>The stored value does not match the schema.</Text>
          </Alert>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            alert strip closed
          </Text>
          <AlertStrip status="warning" title="Missing keys">
            Array items are missing required _key values.
          </AlertStrip>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            details open
          </Text>
          <Details open title="Validation details">
            <Text size={1}>Title is required.</Text>
          </Details>
        </Stack>
      </Stack>
    </Card>
  ),
}
