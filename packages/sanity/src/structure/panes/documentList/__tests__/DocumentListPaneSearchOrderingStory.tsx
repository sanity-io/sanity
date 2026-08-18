import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type PaneMenuItem} from '../../../types'
import {
  DocumentListPaneSearchOrdering,
  RELEVANCE_ORDERING_ID,
} from '../DocumentListPaneSearchOrdering'

const ORDERINGS: PaneMenuItem[] = [
  {
    id: 'updated-desc',
    title: 'Last edited',
    action: 'setSortOrder',
    params: {by: [{field: '_updatedAt', direction: 'desc'}]},
  },
  {
    id: 'title-asc',
    title: 'Title',
    action: 'setSortOrder',
    params: {by: [{field: 'title', direction: 'asc'}]},
  },
]

/**
 * Chromatic sentinel for ui5 Box padding on the document-list search
 * ordering control. The menu stays closed (MenuButton animates). Shared
 * with the co-located Storybook CSF file.
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
              onChange={() => null}
              orderings={[]}
              value={RELEVANCE_ORDERING_ID}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              relevance selected
            </Text>
            <DocumentListPaneSearchOrdering
              onChange={() => null}
              orderings={ORDERINGS}
              value={RELEVANCE_ORDERING_ID}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              configured ordering selected
            </Text>
            <DocumentListPaneSearchOrdering
              onChange={() => null}
              orderings={ORDERINGS}
              value="updated-desc"
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
