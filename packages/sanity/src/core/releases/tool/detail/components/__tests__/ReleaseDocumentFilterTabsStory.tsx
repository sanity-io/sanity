import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createMockDocument} from '../../../../__fixtures__/documentInRelease.fixture'
import {FILTER_TAB_CONFIGS} from '../../releaseDocumentActions'
import {type DocumentInRelease} from '../../types'
import {ReleaseDocumentFilterTabs} from '../ReleaseDocumentFilterTabs'

// One document per action so every tab (added / changed / unpublished /
// errors) has a non-zero count and stays rendered.
const DOCUMENTS: DocumentInRelease[] = [
  createMockDocument({publishedDocumentExists: false}),
  createMockDocument({publishedDocumentExists: true}),
  createMockDocument({publishedDocumentExists: true, systemDelete: true}),
  createMockDocument({publishedDocumentExists: true, hasError: true}),
]

/**
 * Chromatic sentinel for release-detail filter tabs: Box padding plus the
 * selected Tab tone for every filter (all → default, added → positive,
 * changed → caution, unpublished → critical, errors → always critical).
 * Loading skeletons are omitted (animated).
 */
export function ReleaseDocumentFilterTabsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          {FILTER_TAB_CONFIGS.map(({key}) => (
            <VStack gap={2} key={key}>
              <Text muted size={1} weight="medium">
                {key} selected
              </Text>
              <ReleaseDocumentFilterTabs
                activeFilter={key}
                documents={DOCUMENTS}
                onFilterChange={noop}
                releaseState="active"
              />
            </VStack>
          ))}
        </VStack>
      </Card>
    </TestWrapper>
  )
}
