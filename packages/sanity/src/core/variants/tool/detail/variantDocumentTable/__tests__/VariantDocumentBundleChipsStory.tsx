import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../../../releases/__fixtures__/release.fixture'
import {type VariantDocumentVersion} from '../../types'
import {VariantDocumentBundleChips} from '../VariantDocumentBundleChips'

const PUBLISHED: VariantDocumentVersion = {
  documentId: 'doc-1',
  bundleId: 'published',
  releaseRef: null,
  updatedAt: '2023-10-10T08:00:00Z',
}

const DRAFTS: VariantDocumentVersion = {
  documentId: 'doc-1',
  bundleId: 'drafts',
  releaseRef: null,
  updatedAt: '2023-10-10T08:00:00Z',
}

const RELEASE: VariantDocumentVersion = {
  documentId: 'doc-1',
  bundleId: activeASAPRelease.name,
  releaseRef: activeASAPRelease._id,
  updatedAt: '2023-10-10T08:00:00Z',
}

const RELEASES_BY_ID = new Map([[activeASAPRelease._id, activeASAPRelease]])

/**
 * Chromatic sentinel for variant-detail bundle chips (ui5 Box + badge tones
 * for published / drafts / release, plus overflow). Shared with Storybook
 * via a thin CSF wrapper.
 */
export function VariantDocumentBundleChipsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              published
            </Text>
            <VariantDocumentBundleChips releasesById={RELEASES_BY_ID} versions={[PUBLISHED]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              drafts
            </Text>
            <VariantDocumentBundleChips releasesById={RELEASES_BY_ID} versions={[DRAFTS]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              release
            </Text>
            <VariantDocumentBundleChips releasesById={RELEASES_BY_ID} versions={[RELEASE]} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              overflow
            </Text>
            <VariantDocumentBundleChips
              releasesById={RELEASES_BY_ID}
              versions={[PUBLISHED, DRAFTS, RELEASE]}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
