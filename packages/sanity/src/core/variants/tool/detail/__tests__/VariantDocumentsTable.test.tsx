import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {setupVirtualListEnv} from '../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentInVariantGroup} from '../types'
import {VariantDocumentsTable} from '../VariantDocumentsTable'

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(({isPlaceholder, title, subtitle}) => (
    <div data-testid={isPlaceholder ? 'preview-placeholder' : 'preview'}>
      {!isPlaceholder && title && <div>{title}</div>}
      {!isPlaceholder && subtitle && <div>{subtitle}</div>}
    </div>
  )),
}))

vi.mock('../variantDocumentTable/VariantDocumentPreview', () => ({
  VariantDocumentPreview: vi.fn(({row}) => (
    <div data-testid="preview">{row.document.title || row.document._id}</div>
  )),
}))

vi.mock('../variantDocumentTable/VariantDocumentBundleChips', () => ({
  VariantDocumentBundleChips: vi.fn(({versions}) => (
    <div data-testid="bundle-chips">
      {versions.map((version) => version.bundleId ?? 'published').join(',')}
    </div>
  )),
}))

setupVirtualListEnv()

const defaultValidation = {
  hasError: false,
  isValidating: false,
  validation: [],
} as const

const mockRows: DocumentInVariantGroup[] = [
  {
    memoKey: 'group-1',
    groupId: 'article-1',
    validation: defaultValidation,
    document: {
      _id: 'published.scope.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-06-01T00:00:00Z',
      title: 'First article',
    },
    version: {
      documentId: 'published.scope.article-1',
      releaseRef: null,
      updatedAt: '2025-06-01T00:00:00Z',
    },
    versions: [
      {
        documentId: 'published.scope.article-1',
        releaseRef: null,
        updatedAt: '2025-06-01T00:00:00Z',
      },
      {
        documentId: 'drafts.scope.article-1',
        bundleId: 'drafts',
        releaseRef: null,
        updatedAt: '2025-05-01T00:00:00Z',
      },
    ],
  },
  {
    memoKey: 'group-2',
    groupId: 'article-2',
    validation: defaultValidation,
    document: {
      _id: 'drafts.scope.article-2',
      _type: 'article',
      _rev: 'rev-2',
      _createdAt: '2025-01-02T00:00:00Z',
      _updatedAt: '2025-06-02T00:00:00Z',
      title: 'Second article',
    },
    version: {
      documentId: 'drafts.scope.article-2',
      bundleId: 'drafts',
      releaseRef: null,
      updatedAt: '2025-06-02T00:00:00Z',
    },
    versions: [
      {
        documentId: 'drafts.scope.article-2',
        bundleId: 'drafts',
        releaseRef: null,
        updatedAt: '2025-06-02T00:00:00Z',
      },
    ],
  },
]

describe('VariantDocumentsTable', () => {
  const renderTable = async (rows: DocumentInVariantGroup[] = mockRows, loading = false) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<VariantDocumentsTable rows={rows} loading={loading} />, {wrapper})
    await screen.findByPlaceholderText('Search documents')
    return result
  }

  it('shows an empty state when there are no documents', async () => {
    await renderTable([])

    expect(screen.getByText('No documents in this variant')).toBeInTheDocument()
  })

  it('shows loading skeleton rows while documents are loading', async () => {
    await renderTable([], true)

    expect(screen.getAllByTestId('table-row-skeleton')).toHaveLength(3)
    expect(screen.queryByText('No documents in this variant')).not.toBeInTheDocument()
  })

  it('renders document rows with bundle, title, type, and edited columns', async () => {
    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    expect(screen.getByText('First article')).toBeInTheDocument()
    expect(screen.getByText('Second article')).toBeInTheDocument()
    expect(screen.getAllByText('article')).toHaveLength(2)
    expect(screen.getByText('published,drafts')).toBeInTheDocument()
    expect(screen.getByText('drafts')).toBeInTheDocument()
    expect(screen.getByText('Bundle')).toBeInTheDocument()
  })

  it('filters documents when searching by title, id, or type', async () => {
    const user = userEvent.setup()

    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    await user.type(screen.getByPlaceholderText('Search documents'), 'Second')

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
    })

    expect(screen.getByText('Second article')).toBeInTheDocument()
    expect(screen.queryByText('First article')).not.toBeInTheDocument()
  })
})
