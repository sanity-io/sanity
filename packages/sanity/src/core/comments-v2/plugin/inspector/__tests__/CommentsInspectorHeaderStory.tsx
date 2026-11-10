import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

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
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              open
            </Text>
            <CommentsInspectorHeader
              mode="default"
              onClose={NOOP}
              onViewChange={NOOP}
              view="open"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              resolved
            </Text>
            <CommentsInspectorHeader
              mode="default"
              onClose={NOOP}
              onViewChange={NOOP}
              view="resolved"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              upsell
            </Text>
            <CommentsInspectorHeader mode="upsell" onClose={NOOP} onViewChange={NOOP} view="open" />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
