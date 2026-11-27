import {type CurrentUser} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ComponentProps} from 'react'
import {Text, Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type UserListWithPermissionsHookValue} from '../../../../hooks/useUserListWithPermissions'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {CommentsFieldButton} from '../CommentsFieldButton'

const NOOP = () => undefined

const CURRENT_USER: CurrentUser = {
  email: '',
  id: 'doug',
  name: 'Doug',
  // oxlint-disable-next-line no-deprecated -- CurrentUser.role is still required
  role: '',
  roles: [],
  profileImage: '',
  provider: '',
}

const MENTION_OPTIONS: UserListWithPermissionsHookValue = {
  data: [],
  loading: false,
  error: null,
}

const CLOSED_BUTTON_PROPS: Omit<ComponentProps<typeof CommentsFieldButton>, 'count'> = {
  currentUser: CURRENT_USER,
  fieldTitle: 'Title',
  mentionOptions: MENTION_OPTIONS,
  onChange: NOOP,
  onClose: NOOP,
  onCommentAdd: NOOP,
  onDiscard: NOOP,
  open: false,
  readOnly: false,
  value: [],
}

/**
 * Chromatic sentinel for the comments-v2 field button after the ui5
 * Flex/Text/Icon migration. Count badges (1 / 3 / 9+) sit next to the
 * muted comment icon — a mix TypeScript will not catch. Closed only;
 * the empty-field add popover mounts CommentInput and is omitted.
 */
export function CommentsFieldButtonStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              comment counts
            </Text>
            <Flex alignItems="center" gap={3}>
              <CommentsFieldButton {...CLOSED_BUTTON_PROPS} count={1} />
              <CommentsFieldButton {...CLOSED_BUTTON_PROPS} count={3} />
              <CommentsFieldButton {...CLOSED_BUTTON_PROPS} count={12} />
            </Flex>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
