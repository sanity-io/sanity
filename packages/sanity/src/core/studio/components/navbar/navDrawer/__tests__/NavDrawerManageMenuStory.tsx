import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ManageMenu} from '../ManageMenu'

/**
 * Chromatic sentinel for the nav-drawer manage footer after the ui5 Stack
 * to VStack migration: bleed Manage-project row inside a borderTop Card.
 * FreeTrial renders nothing without trial data. The invite-members row stays
 * hidden because the mock workspace has no invite grant. Distinct from the
 * workspace-switcher ManageMenu, which already has a browser test.
 */
export function NavDrawerManageMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            manage menu
          </Text>
          <ManageMenu />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
