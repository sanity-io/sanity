import {render} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentInVariantGroup} from '../types'
import {VariantDocumentPreview} from '../variantDocumentTable/VariantDocumentPreview'

const intentLinkMock = vi.fn(({children, intent, searchParams, params, ...props}) => (
  <a data-testid="edit-intent-link" data-intent={intent} {...props}>
    {children}
  </a>
))

const useDocumentPreviewValuesMock = vi.fn(() => ({isLoading: false, value: {title: 'Article'}}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: (props: React.ComponentProps<'a'>) => intentLinkMock(props),
}))

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(() => <div data-testid="preview" />),
}))

vi.mock('../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: (...args: unknown[]) => useDocumentPreviewValuesMock(...args),
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

const VARIANT_ID = 'alpha-audience'

describe('VariantDocumentPreview', () => {
  beforeEach(() => {
    intentLinkMock.mockClear()
    useDocumentPreviewValuesMock.mockClear()
  })

  it('omits perspective search params for drafts', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('drafts')} variantId={VARIANT_ID} />, {wrapper})

    expect(intentLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'edit',
        searchParams: [['variant', VARIANT_ID]],
      }),
    )
  })

  it('adds perspective=published for published bundle versions', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow(undefined)} variantId={VARIANT_ID} />, {
      wrapper,
    })

    expect(intentLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: [
          ['variant', VARIANT_ID],
          ['perspective', 'published'],
        ],
      }),
    )
  })

  it('adds perspective=<releaseId> for release bundle versions', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('rASAP')} variantId={VARIANT_ID} />, {wrapper})

    expect(intentLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: [
          ['variant', VARIANT_ID],
          ['perspective', 'rASAP'],
        ],
      }),
    )
  })

  it('resolves previews in the published perspective stack', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow(undefined)} variantId={VARIANT_ID} />, {wrapper})

    expect(useDocumentPreviewValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        perspectiveStack: ['published'],
      }),
    )
  })

  it('resolves previews in the drafts perspective stack', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('drafts')} variantId={VARIANT_ID} />, {wrapper})

    expect(useDocumentPreviewValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        perspectiveStack: ['drafts'],
      }),
    )
  })

  it('resolves previews in the release perspective stack with drafts fallback', async () => {
    const wrapper = await createTestProvider()

    render(<VariantDocumentPreview row={createRow('rASAP')} variantId={VARIANT_ID} />, {wrapper})

    expect(useDocumentPreviewValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        perspectiveStack: ['rASAP', 'drafts'],
      }),
    )
  })
})
