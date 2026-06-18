import {render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentInVariantGroup} from '../types'
import {VariantDocumentPreview} from '../variantDocumentTable/VariantDocumentPreview'

const intentLinkMock = vi.fn(({children, ...props}) => (
  <a data-testid="edit-intent-link" {...props}>
    {children}
  </a>
))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: (props: React.ComponentProps<'a'>) => intentLinkMock(props),
}))

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(() => <div data-testid="preview" />),
}))

vi.mock('../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: vi.fn(() => ({isLoading: false, value: {title: 'Article'}})),
}))

vi.mock('../../../../store/presence/useDocumentPresence', () => ({
  useDocumentPresence: vi.fn(() => []),
}))

const createRow = (
  bundleId: DocumentInVariantGroup['version']['bundleId'],
): DocumentInVariantGroup => ({
  memoKey: 'group-1',
  groupId: 'article-1',
  document: {
    _id: 'drafts.scope.article-1',
    _type: 'article',
    _rev: 'rev-1',
    _createdAt: '2025-06-01T00:00:00Z',
    _updatedAt: '2025-06-01T00:00:00Z',
  },
  version: {
    documentId: 'drafts.scope.article-1',
    bundleId,
    releaseRef: bundleId === 'rASAP' ? '_.releases.rASAP' : null,
    updatedAt: '2025-06-01T00:00:00Z',
  },
  versions: [],
})

describe('VariantDocumentPreview', () => {
  beforeEach(() => {
    intentLinkMock.mockClear()
  })

  it('omits perspective search params for drafts', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('drafts')} />, {wrapper})

    expect(intentLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'edit',
        searchParams: undefined,
      }),
    )
  })

  it('adds perspective=published for published bundle versions', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('$published')} />, {wrapper})

    expect(intentLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: [['perspective', 'published']],
      }),
    )
  })

  it('adds perspective=<releaseId> for release bundle versions', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('rASAP')} />, {wrapper})

    expect(intentLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: [['perspective', 'rASAP']],
      }),
    )
  })
})
