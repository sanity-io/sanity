import {render, screen} from '@testing-library/react'
import {useDocumentVersions} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {useReferringDocuments} from '../useReferringDocuments'

vi.mock('sanity', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  useDocumentVersions: vi.fn(),
}))

vi.mock('../useReferringDocuments', () => ({
  useReferringDocuments: vi.fn(),
}))

vi.mock('../ConfirmDeleteDialogBody', () => ({
  ConfirmDeleteDialogBody: () => <div data-testid="dialog-body" />,
}))

vi.mock('../../DocTitle', () => ({
  DocTitle: () => <span>Doc title</span>,
}))

const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUseReferringDocuments = useReferringDocuments as Mock<typeof useReferringDocuments>

const noReferences = {
  internalReferences: {totalCount: 0, references: []},
  crossDatasetReferences: {totalCount: 0, references: []},
  isLoading: false,
  totalCount: 0,
  projectIds: [],
  datasetNames: [],
  hasUnknownDatasetNames: false,
} as unknown as ReturnType<typeof useReferringDocuments>

const withVersions = (count: number) =>
  ({
    data: Array.from({length: count}, (_, i) => `versions.r${i}.doc`),
    loading: false,
  }) as unknown as ReturnType<typeof useDocumentVersions>

describe('ConfirmDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReferringDocuments.mockReturnValue(noReferences)
  })

  it('uses single-document copy when only one version exists', async () => {
    mockUseDocumentVersions.mockReturnValue(withVersions(1))
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(<ConfirmDeleteDialog id="doc1" type="post" onCancel={vi.fn()} onConfirm={vi.fn()} />, {
      wrapper,
    })

    expect(await screen.findByText('Delete document')).toBeInTheDocument()
    expect(screen.queryByText('Delete all versions')).not.toBeInTheDocument()
  })

  it('uses all-versions copy when multiple versions exist', async () => {
    mockUseDocumentVersions.mockReturnValue(withVersions(3))
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(<ConfirmDeleteDialog id="doc1" type="post" onCancel={vi.fn()} onConfirm={vi.fn()} />, {
      wrapper,
    })

    expect(await screen.findByText('Delete all versions')).toBeInTheDocument()
  })

  it('uses single-document copy on the delete-anyway button when references exist', async () => {
    mockUseDocumentVersions.mockReturnValue(withVersions(1))
    mockUseReferringDocuments.mockReturnValue({
      ...noReferences,
      totalCount: 2,
    } as unknown as ReturnType<typeof useReferringDocuments>)
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(<ConfirmDeleteDialog id="doc1" type="post" onCancel={vi.fn()} onConfirm={vi.fn()} />, {
      wrapper,
    })

    expect(await screen.findByText('Delete anyway')).toBeInTheDocument()
    expect(screen.queryByText('Delete all versions anyway')).not.toBeInTheDocument()
  })

  it('hides the confirm button while the version count loads', async () => {
    mockUseDocumentVersions.mockReturnValue({data: [], loading: true} as unknown as ReturnType<
      typeof useDocumentVersions
    >)
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(<ConfirmDeleteDialog id="doc1" type="post" onCancel={vi.fn()} onConfirm={vi.fn()} />, {
      wrapper,
    })

    expect(screen.queryByText('Delete document')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete all versions')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete all versions anyway')).not.toBeInTheDocument()
  })
})
