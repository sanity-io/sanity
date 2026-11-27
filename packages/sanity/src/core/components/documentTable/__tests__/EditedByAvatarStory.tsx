import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {EditedByAvatar} from '../EditedByCell'

/**
 * Chromatic sentinel for the document-table "Edited by" cell after the ui5
 * Flex migration. Wide cells show the display name beside the avatar;
 * a container query hides the name below 108px. Uses the mock workspace
 * current user (`doug` / Doug) so useUser resolves without a network
 * round trip. No imageUrl, no loading skeleton (animated).
 */
export function EditedByAvatarStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              wide — name visible
            </Text>
            <div style={{width: 220}}>
              <EditedByAvatar loading={false} userId="doug" />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              narrow — name collapsed
            </Text>
            <div style={{width: 80}}>
              <EditedByAvatar loading={false} userId="doug" />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
