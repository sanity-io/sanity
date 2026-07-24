import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentInVariantGroup} from '../types'
import {VariantDocumentBundleChips} from '../variantDocumentTable/VariantDocumentBundleChips'

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: vi.fn(({children, intent, searchParams, params, ...props}) => (
    <a data-testid="release-intent-link" data-intent={intent} {...props}>
      {children}
    </a>
  )),
}))

const activeRelease = {
  _id: '_.releases.rASAP',
  _type: 'system.release',
  _rev: 'rev-1',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  state: 'active',
  metadata: {
    title: 'Summer launch',
    releaseType: 'asap',
  },
} as const

const releasesById = new Map([[activeRelease._id, activeRelease]])

const groupedRow: DocumentInVariantGroup = {
  memoKey: 'group-1',
  groupId: 'article-1',
  document: {
    _id: 'published.scope.article-1',
    _type: 'article',
    _rev: 'rev-1',
    _createdAt: '2025-06-01T00:00:00Z',
    _updatedAt: '2025-06-03T00:00:00Z',
    publishedDocumentExists: true,
  },
  version: {
    documentId: 'published.scope.article-1',
    releaseRef: null,
    updatedAt: '2025-06-03T00:00:00Z',
  },
  versions: [
    {
      documentId: 'published.scope.article-1',
      releaseRef: null,
      updatedAt: '2025-06-03T00:00:00Z',
    },
    {
      documentId: 'drafts.scope.article-1',
      bundleId: 'drafts',
      releaseRef: null,
      updatedAt: '2025-06-01T00:00:00Z',
    },
    {
      documentId: 'versions.rASAP.scope.article-1',
      bundleId: 'rASAP',
      releaseRef: '_.releases.rASAP',
      updatedAt: '2025-06-02T00:00:00Z',
    },
  ],
}

describe('VariantDocumentBundleChips', () => {
  it('shows the first bundle chip and collapses the rest into a "+N" overflow badge', async () => {
    const wrapper = await createTestProvider()

    render(
      <VariantDocumentBundleChips versions={groupedRow.versions} releasesById={releasesById} />,
      {wrapper},
    )

    // Only the first bundle (published) renders inline; the fixed-width cell never crops.
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByTestId('variant-bundle-chips-overflow')).toHaveTextContent('+2')
    // The overflowed bundles are hidden until the badge is hovered.
    expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    expect(screen.queryByText('Summer launch')).not.toBeInTheDocument()
  })

  it('renders a single release chip with an intent link and no overflow badge', async () => {
    const wrapper = await createTestProvider()

    render(
      <VariantDocumentBundleChips
        versions={[groupedRow.versions[2]!]}
        releasesById={releasesById}
      />,
      {wrapper},
    )

    expect(screen.getByText('Summer launch')).toBeInTheDocument()
    expect(screen.getByTestId('release-intent-link')).toHaveAttribute('data-intent', 'release')
    expect(screen.queryByTestId('variant-bundle-chips-overflow')).not.toBeInTheDocument()
  })
})
