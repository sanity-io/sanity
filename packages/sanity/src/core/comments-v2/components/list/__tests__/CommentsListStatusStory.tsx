import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {CommentsListStatus} from '../CommentsListStatus'

const FRAME_STYLE = {height: 200, display: 'flex'} as const
const LIST_ERROR = new Error('comments failed to load')

/**
 * Chromatic sentinel for comments-v2 list empty and error chrome after the
 * ui5 Flex/VStack/Container migration. Centered muted copy depends on Flex
 * alignment plus Container padding — a mix TypeScript will not catch.
 * Loading is omitted (spinner). Copy is locale-fixture only.
 */
export function CommentsListStatusStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              empty open
            </Text>
            <div style={FRAME_STYLE}>
              <CommentsListStatus error={null} hasNoComments loading={false} status="open" />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              empty resolved
            </Text>
            <div style={FRAME_STYLE}>
              <CommentsListStatus error={null} hasNoComments loading={false} status="resolved" />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              error
            </Text>
            <div style={FRAME_STYLE}>
              <CommentsListStatus error={LIST_ERROR} hasNoComments loading={false} status="open" />
            </div>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
