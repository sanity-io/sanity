import {DocumentIcon} from '@sanity/icons/Document'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NewDocumentListOption} from '../NewDocumentListOption'
import {type NewDocumentOption} from '../types'

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

/**
 * Chromatic sentinel for new-document list rows after the ui5 Box
 * migration. Inline vs default padding and permitted vs disabled cards
 * pair Box icon gutters with Card padding — a mix TypeScript will not
 * catch. Titles are fixtures (no live templates). `currentUser` only feeds
 * the insufficient-permissions tooltip, which never opens in a snapshot.
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
              currentUser={null}
              onClick={noop}
              option={AUTHOR_OPTION}
              preview="default"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              inline permitted
            </Text>
            <NewDocumentListOption
              currentUser={null}
              onClick={noop}
              option={AUTHOR_OPTION}
              preview="inline"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              inline disabled
            </Text>
            <NewDocumentListOption
              currentUser={null}
              onClick={noop}
              option={DISABLED_OPTION}
              preview="inline"
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
