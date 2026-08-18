import {Card, Stack, Text} from '@sanity/ui'

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
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              published
            </Text>
            <VariantDocumentBundleChips releasesById={RELEASES_BY_ID} versions={[PUBLISHED]} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              drafts
            </Text>
            <VariantDocumentBundleChips releasesById={RELEASES_BY_ID} versions={[DRAFTS]} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              release
            </Text>
            <VariantDocumentBundleChips releasesById={RELEASES_BY_ID} versions={[RELEASE]} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              overflow
            </Text>
            <VariantDocumentBundleChips
              releasesById={RELEASES_BY_ID}
              versions={[PUBLISHED, DRAFTS, RELEASE]}
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
