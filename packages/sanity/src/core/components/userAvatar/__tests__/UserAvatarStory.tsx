import {type User} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {UserAvatar} from '../UserAvatar'

const ADA: User = {id: 'pAda', displayName: 'Ada Lovelace'}

const SCHEMA_TYPES: [] = []

/**
 * Chromatic sentinel for UserAvatar after the Sanity UI Avatar migration.
 * Initials only — a `src` that never loads holds Chromatic's network idle
 * wait. `withTooltip` is the wrapper added so the status-line avatar can
 * show a studio tooltip instead of the native `title` tooltip; play hovers
 * that avatar so the snapshot includes the open tooltip.
 */
export function UserAvatarStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{minHeight: 220, minWidth: 280}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              with tooltip
            </Text>
            <Flex justifyContent="center" paddingTop={6}>
              <UserAvatar size={1} user={ADA} withTooltip />
            </Flex>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              sizes and status
            </Text>
            <Flex alignItems="center" gap={4}>
              <UserAvatar size={0} user={ADA} />
              <UserAvatar size={1} user={ADA} />
              <UserAvatar size={1} status="online" user={ADA} />
            </Flex>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
