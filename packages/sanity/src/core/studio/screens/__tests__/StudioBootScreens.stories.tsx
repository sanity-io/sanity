import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'
import {Text, VStack} from 'ui5'

import {NotFoundScreen} from '../NotFoundScreen'
import {NoToolsScreen} from '../NoToolsScreen'
import {RedirectingScreen} from '../RedirectingScreen'
import {ToolNotFoundScreen} from '../ToolNotFoundScreen'

const FRAME_STYLE = {height: 220}

/**
 * Chromatic sentinel for studio boot/navigation cards after the ui5 Box/Flex
 * migration. These screens mix Box padding with caution/primary Card tones
 * and a ghost button — a combination TypeScript will not catch if Box tokens
 * or icon alignment drift. Copy is hardcoded (no i18n, no timestamps).
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
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            no tools
          </Text>
          <div style={FRAME_STYLE}>
            <NoToolsScreen />
          </div>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            tool not found
          </Text>
          <div style={FRAME_STYLE}>
            <ToolNotFoundScreen toolName="vision" />
          </div>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            redirecting
          </Text>
          <div style={FRAME_STYLE}>
            <RedirectingScreen />
          </div>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            workspace not found
          </Text>
          <div style={FRAME_STYLE}>
            <NotFoundScreen onNavigateToDefaultWorkspace={noop} />
          </div>
        </VStack>
      </VStack>
    </Card>
  ),
}
