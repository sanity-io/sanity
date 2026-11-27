import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ActivityItem} from '../TasksActivityItem'

/**
 * Chromatic sentinel for the task activity row (`ActivityItem`): ui5 Flex
 * avatar slot plus the children column. `userId="doug"` is the mock
 * workspace current user so `useUser` resolves without a network fetch.
 * Copy is a fixture (no relative timestamps).
 */
export function TasksActivityItemStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              default padding
            </Text>
            <ActivityItem userId="doug">
              <Text size={1} as="div" trim={true}>
                Doug created this task
              </Text>
            </ActivityItem>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              extra avatar padding
            </Text>
            <ActivityItem avatarPaddingTop={3} userId="doug">
              <Text size={1} as="div" trim={true}>
                Doug changed the assignee
              </Text>
            </ActivityItem>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
