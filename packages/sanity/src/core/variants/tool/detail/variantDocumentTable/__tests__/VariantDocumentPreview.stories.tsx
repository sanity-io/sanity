import {type SanityDocumentLike} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {expect, waitFor, within} from 'storybook/test'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useClient} from '../../../../../hooks/useClient'
import {
  type DocumentPreviewStore,
  type ObserveForPreviewFn,
} from '../../../../../preview/documentPreviewStore'
import {activeASAPRelease} from '../../../../../releases/__fixtures__/release.fixture'
import {ResourceCacheProvider, useResourceCache} from '../../../../../store/ResourceCacheProvider'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {type DocumentInVariantGroup, type VariantDocumentVersion} from '../../types'
import {VariantDocumentPreview} from '../VariantDocumentPreview'

const ARTICLE_TYPE = {
  name: 'article',
  type: 'document',
  fields: [
    {name: 'title', type: 'string'},
    {name: 'summary', type: 'string'},
  ],
  preview: {select: {title: 'title', subtitle: 'summary'}},
}

const UPDATED_AT = '2023-10-10T08:00:00Z'

const PREVIEWS: Record<string, {title: string; subtitle?: string}> = {
  'published-article': {title: 'Summer campaign', subtitle: 'Live on the site'},
  'draft-article': {title: 'Autumn campaign (draft)'},
  'release-article': {title: 'Winter campaign', subtitle: 'Scheduled for the release'},
  'mixed-article': {title: 'Evergreen article', subtitle: 'Published, drafted and in a release'},
}

/**
 * The mock studio's client returns `null` for every query, which the real
 * preview store cannot reassemble, so previews are served from a fixture
 * keyed by published id instead.
 */
const observeForPreview: ObserveForPreviewFn = (value, type) => {
  const id = (value as SanityDocumentLike)._id
  return of({type, snapshot: PREVIEWS[id] ?? null})
}

const STUB_PREVIEW_STORE = {observeForPreview} as unknown as DocumentPreviewStore

function StubPreviewStore(props: {children: ReactNode}) {
  const {children} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()
  // Seeded during the first render so `useDocumentPreviewStore` in the
  // children finds the stub instead of creating the real store.
  useState(() => {
    resourceCache.set({
      namespace: 'documentPreviewStore',
      dependencies: [client],
      value: STUB_PREVIEW_STORE,
    })
    return null
  })
  return children
}

function version(
  groupId: string,
  bundle: 'published' | 'drafts' | 'release',
): VariantDocumentVersion {
  if (bundle === 'published') {
    return {documentId: groupId, bundleId: 'published', releaseRef: null, updatedAt: UPDATED_AT}
  }
  if (bundle === 'drafts') {
    return {
      documentId: `drafts.${groupId}`,
      bundleId: 'drafts',
      releaseRef: null,
      updatedAt: UPDATED_AT,
    }
  }
  return {
    documentId: `versions.${activeASAPRelease.name}.${groupId}`,
    bundleId: activeASAPRelease.name,
    releaseRef: activeASAPRelease._id,
    updatedAt: UPDATED_AT,
  }
}

function row(groupId: string, latest: VariantDocumentVersion, versions: VariantDocumentVersion[]) {
  const group: DocumentInVariantGroup = {
    memoKey: latest.documentId,
    groupId,
    rowKey: groupId,
    document: {
      _id: latest.documentId,
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: UPDATED_AT,
      _updatedAt: UPDATED_AT,
      publishedDocumentExists: versions.some((v) => v.bundleId === 'published'),
    },
    validation: {validation: [], isValidating: false, hasError: false},
    version: latest,
    versions,
  }
  return group
}

const PUBLISHED_ROW = row('published-article', version('published-article', 'published'), [
  version('published-article', 'published'),
])
const DRAFTS_ROW = row('draft-article', version('draft-article', 'drafts'), [
  version('draft-article', 'drafts'),
])
const RELEASE_ROW = row('release-article', version('release-article', 'release'), [
  version('release-article', 'release'),
])
// The latest version is in the release, but the leading badge and the link
// follow the primary bundle (published first).
const MIXED_ROW = row('mixed-article', version('mixed-article', 'release'), [
  version('mixed-article', 'published'),
  version('mixed-article', 'drafts'),
  version('mixed-article', 'release'),
])

const RELEASES_BY_ID = new Map([[activeASAPRelease._id, activeASAPRelease]])

/**
 * The preview column of the variant detail table: the primary-bundle badge
 * (published / drafts / release avatar) in front of the document's default
 * preview, wrapped in an edit intent link.
 */
const meta = {
  title: 'Core/Variants/Variant Document Preview',
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[ARTICLE_TYPE]}>
        <ResourceCacheProvider>
          <StubPreviewStore>
            <Card padding={4} style={{maxWidth: 400}}>
              <Story />
            </Card>
          </StubPreviewStore>
        </ResourceCacheProvider>
      </TestWrapper>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Bundles: Story = {
  render: () => (
    <VStack gap={5}>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          published
        </Text>
        <VariantDocumentPreview releasesById={RELEASES_BY_ID} row={PUBLISHED_ROW} />
      </VStack>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          drafts
        </Text>
        <VariantDocumentPreview releasesById={RELEASES_BY_ID} row={DRAFTS_ROW} />
      </VStack>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          release
        </Text>
        <VariantDocumentPreview releasesById={RELEASES_BY_ID} row={RELEASE_ROW} />
      </VStack>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          published + drafts + release (badge follows the primary bundle)
        </Text>
        <VariantDocumentPreview releasesById={RELEASES_BY_ID} row={MIXED_ROW} variantId="mobile" />
      </VStack>
    </VStack>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // Wait until every preview has left its skeleton placeholder state.
    await waitFor(
      async () => {
        await expect(canvas.getAllByTestId('default-preview__header')).toHaveLength(4)
        await expect(canvas.getByText('Summer campaign')).toBeVisible()
        await expect(canvas.getByText('Autumn campaign (draft)')).toBeVisible()
        await expect(canvas.getByText('Winter campaign')).toBeVisible()
        await expect(canvas.getByText('Evergreen article')).toBeVisible()
      },
      {timeout: 5000},
    )
    const links = canvas.getAllByRole('link')
    await expect(links).toHaveLength(4)
    // The mixed row links to the published perspective of its variant.
    await expect(links[3].getAttribute('href')).toContain('perspective=published')
  },
}
