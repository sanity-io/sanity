import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentInRelease} from '../../types'
import {ReleaseDocumentFilterTabs} from '../ReleaseDocumentFilterTabs'

function createDocument(
  overrides: Partial<{
    hasError: boolean
    publishedDocumentExists: boolean
    systemDelete: boolean
  }> = {},
): DocumentInRelease {
  const {hasError = false, publishedDocumentExists = false, systemDelete = false} = overrides

  return {
    memoKey: 'test-key',
    document: {
      _id: 'test-id',
      _type: 'article',
      _rev: 'test-rev',
      _createdAt: '2024-01-01T00:00:00.000Z',
      _updatedAt: '2024-01-01T00:00:00.000Z',
      publishedDocumentExists,
      ...(systemDelete ? {_system: {delete: true}} : {}),
    },
    validation: {
      hasError,
      isValidating: false,
      validation: [],
    },
  }
}

const DOCUMENTS: DocumentInRelease[] = [
  createDocument({publishedDocumentExists: false}),
  createDocument({publishedDocumentExists: true}),
  createDocument({publishedDocumentExists: true, systemDelete: true}),
  createDocument({publishedDocumentExists: true, hasError: true}),
]

/**
 * Chromatic sentinel for release-detail filter tabs: Box padding plus Tab
 * tones (default / positive / caution / critical). Loading skeletons are
 * omitted (animated). Shared with the co-located Storybook CSF file.
 */
export function ReleaseDocumentFilterTabsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              all selected
            </Text>
            <ReleaseDocumentFilterTabs
              activeFilter="all"
              documents={DOCUMENTS}
              onFilterChange={() => null}
              releaseState="active"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              added selected
            </Text>
            <ReleaseDocumentFilterTabs
              activeFilter="added"
              documents={DOCUMENTS}
              onFilterChange={() => null}
              releaseState="active"
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              errors selected
            </Text>
            <ReleaseDocumentFilterTabs
              activeFilter="errors"
              documents={DOCUMENTS}
              onFilterChange={() => null}
              releaseState="active"
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
