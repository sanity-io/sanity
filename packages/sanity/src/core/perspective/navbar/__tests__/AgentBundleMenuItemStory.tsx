import {Card, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {AgentBundleMenuItem} from '../AgentBundleMenuItem'

const BUNDLE = {id: 'agent-story', applicationKey: 'story-app'}

/**
 * Chromatic sentinel for the agent-bundle perspective menu item: ui5 Box
 * padding around the sparkle icon (badge-suggest color). Unselected; the
 * menu stays open as a static list. Shared with Storybook via a thin CSF
 * wrapper.
 */
export function AgentBundleMenuItemStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            unselected
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <AgentBundleMenuItem bundle={BUNDLE} />
            </Menu>
          </Card>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
