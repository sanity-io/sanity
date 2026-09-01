import {DocumentIcon} from '@sanity/icons/Document'
import {type CurrentUser} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NewDocumentListOption} from '../NewDocumentListOption'
import {type NewDocumentOption} from '../types'

const CURRENT_USER: CurrentUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@test.com',
  // oxlint-disable-next-line no-deprecated -- CurrentUser still requires the legacy role field
  role: '',
  roles: [],
}

const AUTHOR_OPTION: NewDocumentOption = {
  hasPermission: true,
  icon: DocumentIcon,
  id: 'author',
  schemaType: 'author',
  templateId: 'author',
  title: 'Author',
  type: 'initialValueTemplateItem',
}

const DISABLED_OPTION: NewDocumentOption = {
  ...AUTHOR_OPTION,
  hasPermission: false,
  id: 'article',
  schemaType: 'article',
  templateId: 'article',
  title: 'Article',
}

const NOOP = () => undefined

/**
 * Chromatic sentinel for new-document list rows after the ui5 Box
 * migration. Inline vs default padding and permitted vs disabled cards
 * pair Box icon gutters with Card padding — a mix TypeScript will not
 * catch. Titles are fixtures (no live templates).
 */
export function NewDocumentListOptionStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              default permitted
            </Text>
            <NewDocumentListOption
              currentUser={CURRENT_USER}
              onClick={NOOP}
              option={AUTHOR_OPTION}
              preview="default"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              inline permitted
            </Text>
            <NewDocumentListOption
              currentUser={CURRENT_USER}
              onClick={NOOP}
              option={AUTHOR_OPTION}
              preview="inline"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              inline disabled
            </Text>
            <NewDocumentListOption
              currentUser={CURRENT_USER}
              onClick={NOOP}
              option={DISABLED_OPTION}
              preview="inline"
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
