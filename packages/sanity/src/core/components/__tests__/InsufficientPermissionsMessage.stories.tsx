import {type CurrentUser} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {
  InsufficientPermissionsMessage,
  type InsufficientPermissionsMessageProps,
} from '../InsufficientPermissionsMessage'
import {InsufficientPermissionsMessageStory} from './InsufficientPermissionsMessageStory'

const editor: CurrentUser = {
  id: 'jane',
  name: 'Jane Editor',
  email: 'jane@example.com',
  // oxlint-disable-next-line no-deprecated -- `role` is still a required field on CurrentUser
  role: 'editor',
  roles: [{name: 'editor', title: 'Editor'}],
}

const CONTEXTS: InsufficientPermissionsMessageProps['context'][] = [
  'publish-document',
  'unpublish-document',
  'delete-document',
  'discard-changes',
  'duplicate-document',
  'create-new-reference',
  'create-document',
  'create-document-type',
  'create-any-document',
]

/**
 * The access-denied panel shown when the current user lacks the grant for an
 * action. It pairs the access-denied icon with a localized explanation keyed
 * by `context` (the attempted action) and a list-formatted rendering of the
 * roles the user does hold. Rendered inside `TestWrapper` for the studio i18n
 * and list formatting it resolves through.
 */
const meta = {
  title: 'Studio/Insufficient Permissions Message',
  component: InsufficientPermissionsMessageStory,
} satisfies Meta<typeof InsufficientPermissionsMessageStory>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Reuses the in-package harness: Box padding and role-list copy on the
 * permissions-denied message after the ui5 Box migration.
 */
export const States: Story = {}

/**
 * Every `context` variant for one single-role user: only the explanation line
 * changes between them.
 */
export const AllContexts: Story = {
  render: () => (
    <TestWrapper schemaTypes={[]}>
      <Flex gap={4} wrap="wrap">
        {CONTEXTS.map((context) => (
          <Card key={context} padding={4} radius={2} shadow={1} style={{width: 300}}>
            <Stack gap={3}>
              <Text muted size={0} weight="medium">
                {context}
              </Text>
              <InsufficientPermissionsMessage context={context} currentUser={editor} />
            </Stack>
          </Card>
        ))}
      </Flex>
    </TestWrapper>
  ),
}
