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

// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
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
  it('renders published, draft, and linked release chips', async () => {
    const wrapper = await createTestProvider()

    render(
      // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
      <VariantDocumentBundleChips versions={groupedRow.versions} releasesById={releasesById} />,
      {wrapper},
    )

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Summer launch')).toBeInTheDocument()
    expect(screen.getByTestId('release-intent-link')).toHaveAttribute('data-intent', 'release')
  })
})
