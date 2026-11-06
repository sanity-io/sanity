import {type User} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {type DocumentPresence} from '../../store/presence/types'
import {DocumentPreviewPresence} from '../DocumentPreviewPresence'

const ada: User = {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@example.com'}
const grace: User = {id: 'grace', displayName: 'Grace Hopper', email: 'grace@example.com'}
const alan: User = {id: 'alan', displayName: 'Alan Turing', email: 'alan@example.com'}

function presence(user: User): Omit<DocumentPresence, 'path'> {
  return {
    user,
    sessionId: `session-${user.id}`,
    lastActiveAt: '2024-01-01T00:00:00.000Z',
    documentId: 'drafts.doc-1',
  }
}

/**
 * Chromatic sentinel for document-list presence stacks after the Sanity UI
 * AvatarStack / theme-space margin migration: one avatar, two avatars, and
 * three avatars (maxLength=2 overflow). Fixture users have no imageUrl so
 * initials stay deterministic. Tooltips stay closed. Draft document ids keep
 * the tooltip copy off the release-title path.
 */
export function DocumentPreviewPresenceStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              one editor
            </Text>
            <DocumentPreviewPresence presence={[presence(ada)]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              two editors
            </Text>
            <DocumentPreviewPresence presence={[presence(ada), presence(grace)]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              three editors (overflow)
            </Text>
            <DocumentPreviewPresence presence={[presence(ada), presence(grace), presence(alan)]} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
