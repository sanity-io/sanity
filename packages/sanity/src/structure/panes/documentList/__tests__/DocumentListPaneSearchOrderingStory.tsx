import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  DocumentListPaneSearchOrdering,
  RELEVANCE_ORDERING_ID,
} from '../DocumentListPaneSearchOrdering'
import {ORDERINGS} from './DocumentListPaneSearchOrdering.fixture'

/**
 * Chromatic sentinel for ui5 Box padding on the document-list search
 * ordering control. The menu stays closed (MenuButton animates). Grid
 * harness for the co-located Storybook CSF file.
 */
export function DocumentListPaneSearchOrderingStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              no configured orderings
            </Text>
            <DocumentListPaneSearchOrdering
              onChange={noop}
              orderings={[]}
              value={RELEVANCE_ORDERING_ID}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              relevance selected
            </Text>
            <DocumentListPaneSearchOrdering
              onChange={noop}
              orderings={ORDERINGS}
              value={RELEVANCE_ORDERING_ID}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              configured ordering selected
            </Text>
            <DocumentListPaneSearchOrdering
              onChange={noop}
              orderings={ORDERINGS}
              value="updated-desc"
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
