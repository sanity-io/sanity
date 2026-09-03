import {type CurrentUser} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {InsufficientPermissionsMessage} from '../InsufficientPermissionsMessage'

const EDITOR: CurrentUser = {
  id: 'pabc123',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  // oxlint-disable-next-line no-deprecated -- CurrentUser still requires the legacy role field
  role: 'editor',
  roles: [{name: 'editor', title: 'Editor'}],
}

const MULTI_ROLE: CurrentUser = {
  ...EDITOR,
  roles: [
    {name: 'editor', title: 'Editor'},
    {name: 'contributor', title: 'Contributor'},
  ],
}

/**
 * Chromatic sentinel for ui5 Box padding on the permissions-denied copy used
 * by document actions, create buttons, and reference create. Role titles are
 * fixtures (no live user). Shared with the co-located Storybook CSF file.
 */
export function InsufficientPermissionsMessageStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              no roles
            </Text>
            <InsufficientPermissionsMessage context="create-any-document" />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              single role
            </Text>
            <InsufficientPermissionsMessage context="publish-document" currentUser={EDITOR} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              multiple roles
            </Text>
            <InsufficientPermissionsMessage context="delete-document" currentUser={MULTI_ROLE} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              create reference
            </Text>
            <InsufficientPermissionsMessage context="create-new-reference" currentUser={EDITOR} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
