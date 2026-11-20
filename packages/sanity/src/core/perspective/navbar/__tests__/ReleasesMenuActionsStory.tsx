import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ViewContentReleasesMenuItem} from '../releases/ViewContentReleasesMenuItem'

/**
 * Chromatic sentinel for the sticky bottom of the releases perspective menu:
 * the "View content releases" row. Rendered as a static Menu list so the
 * snapshot shows the Calendar icon and MenuItem chrome without opening a
 * popover. Shared with Storybook via a thin CSF wrapper.
 */
export function ReleasesMenuActionsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            view content releases
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <ViewContentReleasesMenuItem />
            </Menu>
          </Card>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
