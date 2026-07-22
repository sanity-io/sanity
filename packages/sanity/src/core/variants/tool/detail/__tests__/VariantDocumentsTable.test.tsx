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

// Mock the "Edited by" cell so the table test doesn't reach the transaction-log / user-profile
// fetches it makes per row (those are covered by the cell's own unit tests).
vi.mock('../../../../components/documentTable/EditedByCell', () => ({
  EditedByCell: vi.fn(({documentId}) => <div data-testid="edited-by">{documentId}</div>),
}))

vi.mock('../../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
  })),
}))

// Wide viewport so the primary bulk buttons render inline (not collapsed into the "more" menu).
vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useMediaIndex: vi.fn(() => 4),
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
      publishedDocumentExists: true,
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
      publishedDocumentExists: false,
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
    // Search now lives in the command lane (only shown with documents), so settle on the table
    // container, which is always present regardless of rows/loading.
    await screen.findByTestId('variant-documents-table')
    return result
  }

  it('shows an empty state when there are no documents', async () => {
    await renderTable([])

    expect(screen.getByText('No documents in this variant definition')).toBeInTheDocument()
  })

  it('shows loading skeleton rows while documents are loading', async () => {
    await renderTable([], true)

    expect(screen.getAllByTestId('table-row-skeleton')).toHaveLength(3)
    expect(screen.queryByText('No documents in this variant definition')).not.toBeInTheDocument()
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
    expect(screen.getByText('Appears in')).toBeInTheDocument()
    // Each row gets a trailing per-row actions (⋯) menu, mirroring the releases table.
    expect(screen.getAllByTestId('variant-document-actions')).toHaveLength(2)
  })

  it('filters documents when searching by title or name', async () => {
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

  it('filters documents by release lane and clears on re-click', async () => {
    const user = userEvent.setup()

    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    // The lane appears because the documents span more than one bundle (published + drafts).
    expect(screen.getByTestId('variant-release-lane')).toBeInTheDocument()

    // Only the first article has a published version.
    await user.click(screen.getByTestId('variant-release-lane-segment-published'))

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
    })
    expect(screen.getByText('First article')).toBeInTheDocument()
    expect(screen.queryByText('Second article')).not.toBeInTheDocument()

    // Clicking the active segment again clears the filter back to all documents.
    await user.click(screen.getByTestId('variant-release-lane-segment-published'))

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })
  })

  it('sorts rows by document group id on first load', async () => {
    const rows: DocumentInVariantGroup[] = [
      {
        ...mockRows[1]!,
        groupId: 'z-group',
        memoKey: 'group-z',
        document: {
          ...mockRows[1]!.document,
          title: 'Zulu article',
        },
      },
      {
        ...mockRows[0]!,
        groupId: 'a-group',
        memoKey: 'group-a',
        document: {
          ...mockRows[0]!.document,
          title: 'Alpha article',
        },
      },
    ]

    await renderTable(rows)

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    const renderedTitles = screen.getAllByTestId('preview').map((node) => node.textContent)

    expect(renderedTitles).toEqual(['Alpha article', 'Zulu article'])
  })

  it('swaps the command lane into a bulk toolbar on selection', async () => {
    const user = userEvent.setup()

    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    // Idle: search is shown, no bulk toolbar.
    expect(screen.getByTestId('variant-documents-search')).toBeInTheDocument()
    expect(screen.queryByTestId('variant-bulk-publish')).not.toBeInTheDocument()

    const rowCheckboxes = screen.getAllByRole('checkbox', {name: 'Select document'})
    expect(rowCheckboxes).toHaveLength(2)

    await user.click(rowCheckboxes[0]!)

    // Selecting swaps browse controls (search) for the bulk toolbar: count + primary actions.
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.getByTestId('variant-bulk-publish')).toBeInTheDocument()
    expect(screen.getByTestId('variant-bulk-add-to-release')).toBeInTheDocument()
    expect(screen.queryByTestId('variant-documents-search')).not.toBeInTheDocument()
  })

  it('uses the select-all box to select every document and to clear', async () => {
    const user = userEvent.setup()

    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    // Select-all lives in the column-header row (above the row checkboxes), present from a cold
    // state, and there is exactly one.
    const selectAll = screen.getByRole('checkbox', {name: 'Select all documents'})

    await user.click(selectAll)
    expect(screen.getByText('2 selected')).toBeInTheDocument()

    // Clicking it again clears (GitHub-style) — the toolbar reverts to the search control.
    await user.click(screen.getByRole('checkbox', {name: 'Select all documents'}))

    await waitFor(() => {
      expect(screen.getByTestId('variant-documents-search')).toBeInTheDocument()
    })
    expect(screen.queryByText('2 selected')).not.toBeInTheDocument()
  })

  it('shows Publish and Add to release as primary actions with Unpublish and Delete under a more menu', async () => {
    const user = userEvent.setup()

    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    await user.click(screen.getAllByRole('checkbox', {name: 'Select document'})[0]!)

    // Publish + Add to release are the primary constructive buttons (stubbed disabled).
    expect(screen.getByTestId('variant-bulk-publish')).toBeDisabled()
    expect(screen.getByTestId('variant-bulk-add-to-release')).toBeDisabled()

    // Unpublish + the destructive Delete live behind the "more" overflow.
    await user.click(screen.getByTestId('variant-bulk-more'))
    expect(await screen.findByText('Unpublish')).toBeInTheDocument()
    expect(screen.getByTestId('variant-bulk-delete')).toBeInTheDocument()
  })

  it('puts search in the command lane, not the column header', async () => {
    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    // Search moved out of the column-header row into the command lane; the preview column is now
    // a plain sortable "Document" label.
    expect(screen.getByTestId('variant-documents-search')).toBeInTheDocument()
    expect(screen.getByText('Document')).toBeInTheDocument()
  })

  it('finds documents by name when title is missing', async () => {
    const user = userEvent.setup()
    const rows: DocumentInVariantGroup[] = [
      {
        ...mockRows[0]!,
        groupId: 'article-named',
        memoKey: 'group-named',
        document: {
          ...mockRows[0]!.document,
          title: undefined,
          name: 'Named article',
        },
      },
    ]

    await renderTable(rows)

    await user.type(screen.getByPlaceholderText('Search documents'), 'Named')

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
    })
  })
})
