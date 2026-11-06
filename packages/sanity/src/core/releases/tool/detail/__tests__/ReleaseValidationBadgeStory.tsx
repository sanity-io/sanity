import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseValidationBadge} from '../ReleaseValidationBadge'
import {type DocumentInRelease} from '../types'

function releaseDoc(opts: {hasError: boolean; isValidating: boolean}): DocumentInRelease {
  return {
    memoKey: 'article-1',
    document: {
      _id: 'article-1',
      _type: 'article',
      _rev: 'rev1',
      _createdAt: '2024-01-01T00:00:00.000Z',
      _updatedAt: '2024-01-01T00:00:00.000Z',
      publishedDocumentExists: true,
    },
    validation: {
      isValidating: opts.isValidating,
      hasError: opts.hasError,
      validation: [],
      revision: 'rev1',
    },
  }
}

const VALID_DOCS = [releaseDoc({hasError: false, isValidating: false})]
const ERROR_DOCS = [releaseDoc({hasError: true, isValidating: false})]
const VALIDATING_DOCS = [releaseDoc({hasError: false, isValidating: true})]

/**
 * Chromatic sentinel for the release properties validation status after
 * the `@sanity/ui` Card tone migration. Valid (positive), errors
 * (critical), validating (default), and empty (muted text) all depend on
 * Card setting the foreground colour while keeping a transparent
 * background — a mix TypeScript will not catch. Locale-fixture labels
 * only; no live documents.
 */
export function ReleaseValidationBadgeStory() {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              empty
            </Text>
            <ReleaseValidationBadge documents={[]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              valid
            </Text>
            <ReleaseValidationBadge documents={VALID_DOCS} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              errors
            </Text>
            <ReleaseValidationBadge documents={ERROR_DOCS} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              validating
            </Text>
            <ReleaseValidationBadge documents={VALIDATING_DOCS} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
