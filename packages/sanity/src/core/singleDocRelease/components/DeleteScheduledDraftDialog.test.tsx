import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useSchema} from '../../hooks'
import {scheduledRelease} from '../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {
  mockUseScheduleDraftOperations,
  useScheduleDraftOperationsMockReturn,
} from '../hooks/__mocks__/useScheduleDraftOperations.mock'
import {useScheduledDraftDocument} from '../hooks/useScheduledDraftDocument'
import {DeleteScheduledDraftDialog} from './DeleteScheduledDraftDialog'

vi.mock('../hooks/useScheduledDraftDocument')
vi.mock('../hooks/useScheduleDraftOperations')
vi.mock('../../releases/hooks/useDocumentVersions')
vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks')
  return {
    ...actual,
    useSchema: vi.fn(),
  }
})

const mockUseScheduledDraftDocument = useScheduledDraftDocument as MockedFunction<
  typeof useScheduledDraftDocument
>
const mockUseDocumentVersions = useDocumentVersions as MockedFunction<typeof useDocumentVersions>
const mockUseSchema = useSchema as MockedFunction<typeof useSchema>

const mockFirstDocument = {
  _id: 'drafts.article-123.releases.rScheduled',
  _type: 'article',
  _rev: 'scheduled-rev-123',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _system: {
    base: {
      rev: 'base-rev-456',
    },
  },
  title: 'Test Article',
}

const mockDraftDocument = {
  _id: 'drafts.article-123',
  _rev: 'draft-rev-789',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: null,
    group: {_ref: 'article-123', _weak: true},
    scopeId: null,
  },
}

const mockDraftDocumentSameRev = {
  _id: 'drafts.article-123',
  _rev: 'base-rev-456',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: null,
    group: {_ref: 'article-123', _weak: true},
    scopeId: null,
  },
}

const mockSchemaType = {
  name: 'article',
  title: 'Article',
  type: 'document',
}

const mockSchema = {
  get: vi.fn().mockReturnValue(mockSchemaType),
} as unknown as ReturnType<typeof useSchema>

const createMockDocumentVersions = (draft: typeof mockDraftDocument | undefined) => ({
  data: draft ? [draft._id] : [],
  versions: draft ? [draft] : [],
  error: null,
  loading: false,
})

const createMockScheduledDraftDocument = (firstDocument: typeof mockFirstDocument | undefined) => ({
  firstDocument,
  firstDocumentPreview: firstDocument ? {title: firstDocument.title} : undefined,
  firstDocumentValidation: undefined,
  documentsCount: firstDocument ? 1 : 0,
  loading: false,
  error: null,
  previewLoading: false,
})

describe('DeleteScheduledDraftDialog', () => {
  let TestProvider: React.ComponentType<{children: React.ReactNode}>
  const mockOnClose = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    mockUseScheduleDraftOperations.mockReturnValue(useScheduleDraftOperationsMockReturn)
    useScheduleDraftOperationsMockReturn.deleteScheduledDraft.mockResolvedValue(undefined)
    mockUseSchema.mockReturnValue(mockSchema)
    mockUseScheduledDraftDocument.mockReturnValue(
      createMockScheduledDraftDocument(mockFirstDocument),
    )
    TestProvider = await createTestProvider()
  })

  it('no draft exists: shows "will save to draft" message and copies on delete', async () => {
    mockUseDocumentVersions.mockReturnValue(createMockDocumentVersions(undefined))

    render(
      <TestProvider>
        <DeleteScheduledDraftDialog
          documentId="article-123"
          documentType="article"
          release={scheduledRelease}
          onClose={mockOnClose}
        />
      </TestProvider>,
    )

    expect(
      screen.getByText('Delete this scheduled draft? Your changes will be saved to draft.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        true,
        'article-123',
      )
    })
  })

  it('draft exists with same revision: shows "already up to date" message and skips copy', async () => {
    mockUseDocumentVersions.mockReturnValue(createMockDocumentVersions(mockDraftDocumentSameRev))

    render(
      <TestProvider>
        <DeleteScheduledDraftDialog
          documentId="article-123"
          documentType="article"
          release={scheduledRelease}
          onClose={mockOnClose}
        />
      </TestProvider>,
    )

    expect(
      screen.getByText('Delete this scheduled draft? Your draft is already up to date.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        false,
        'article-123',
      )
    })
  })

  it('draft exists with different revision: shows checkbox (checked by default) and copies when checked', async () => {
    mockUseDocumentVersions.mockReturnValue(createMockDocumentVersions(mockDraftDocument))

    render(
      <TestProvider>
        <DeleteScheduledDraftDialog
          documentId="article-123"
          documentType="article"
          release={scheduledRelease}
          onClose={mockOnClose}
        />
      </TestProvider>,
    )

    expect(screen.getByText('Delete this scheduled draft?')).toBeInTheDocument()
    expect(
      screen.getByText('Your scheduled draft has different changes than your current draft.'),
    ).toBeInTheDocument()

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        true,
        'article-123',
      )
    })
  })

  it('draft exists with different revision: skips copy when checkbox unchecked', async () => {
    mockUseDocumentVersions.mockReturnValue(createMockDocumentVersions(mockDraftDocument))

    render(
      <TestProvider>
        <DeleteScheduledDraftDialog
          documentId="article-123"
          documentType="article"
          release={scheduledRelease}
          onClose={mockOnClose}
        />
      </TestProvider>,
    )

    const checkbox = screen.getByRole('checkbox')
    await userEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        false,
        'article-123',
      )
    })
  })

  it('empty release: shows "already up to date" message and skips copy', async () => {
    mockUseScheduledDraftDocument.mockReturnValue(createMockScheduledDraftDocument(undefined))

    render(
      <TestProvider>
        <DeleteScheduledDraftDialog
          documentId={undefined}
          documentType={undefined}
          release={scheduledRelease}
          onClose={mockOnClose}
        />
      </TestProvider>,
    )

    expect(
      screen.getByText('Delete this scheduled draft? Your draft is already up to date.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        false,
        undefined,
      )
    })
  })
})
