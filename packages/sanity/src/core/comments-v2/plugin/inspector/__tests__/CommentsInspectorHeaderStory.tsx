import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {CommentsInspectorHeader} from '../CommentsInspectorHeader'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the comments-v2 inspector header after the ui5
 * Flex migration. Title, bleed filter, and close sit in one Flex row —
 * spacing and truncation TypeScript will not catch. Menus stay closed
 * (filter flyout is covered by ui-components MenuButton). Copy is
 * locale-fixture only.
 */
export function CommentsInspectorHeaderStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              open
            </Text>
            <CommentsInspectorHeader
              mode="default"
              onClose={NOOP}
              onViewChange={NOOP}
              view="open"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              resolved
            </Text>
            <CommentsInspectorHeader
              mode="default"
              onClose={NOOP}
              onViewChange={NOOP}
              view="resolved"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              upsell
            </Text>
            <CommentsInspectorHeader mode="upsell" onClose={NOOP} onViewChange={NOOP} view="open" />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
