import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NoToolsScreen} from '../NoToolsScreen'
import {RedirectingScreen} from '../RedirectingScreen'
import {ToolNotFoundScreen} from '../ToolNotFoundScreen'

const FRAME_STYLE = {height: 220}

/**
 * Chromatic sentinel for studio boot/navigation cards after the ui5 Box
 * migration. These screens mix Box padding with caution/primary Card tones —
 * a combination TypeScript will not catch if Box tokens or icon alignment
 * drift. Copy is hardcoded (no i18n, no timestamps).
 */
const meta = {
  title: 'Studio/Boot Screens',
  component: NoToolsScreen,
} satisfies Meta<typeof NoToolsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: () => (
    <Card padding={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            no tools
          </Text>
          <div style={FRAME_STYLE}>
            <NoToolsScreen />
          </div>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            tool not found
          </Text>
          <div style={FRAME_STYLE}>
            <ToolNotFoundScreen toolName="vision" />
          </div>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            redirecting
          </Text>
          <div style={FRAME_STYLE}>
            <RedirectingScreen />
          </div>
        </Stack>
      </Stack>
    </Card>
  ),
}
