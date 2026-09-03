import {Card, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {CommentsListStatus} from '../CommentsListStatus'

function StatusFrame({children}: {children: ReactNode}) {
  return (
    <Card border radius={2} style={{display: 'flex', flexDirection: 'column', minHeight: 160}}>
      {children}
    </Card>
  )
}

/**
 * Chromatic sentinel for ui5 Flex alignment and padding on comments empty
 * and error states (the Flex migration). Loading uses a spinner and is
 * omitted. Shared with the co-located Storybook CSF file.
 */
export function CommentsListStatusStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              error
            </Text>
            <StatusFrame>
              <CommentsListStatus
                error={new Error('Failed to load comments')}
                hasNoComments
                loading={false}
                status="open"
              />
            </StatusFrame>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              empty open
            </Text>
            <StatusFrame>
              <CommentsListStatus error={null} hasNoComments loading={false} status="open" />
            </StatusFrame>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              empty resolved
            </Text>
            <StatusFrame>
              <CommentsListStatus error={null} hasNoComments loading={false} status="resolved" />
            </StatusFrame>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
