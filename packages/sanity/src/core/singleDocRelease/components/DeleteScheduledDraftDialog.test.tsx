import {type SanityDocument} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useSchema} from '../../hooks/useSchema'
import {useUnstableObserveDocument} from '../../preview/useObserveDocument'
import {scheduledRelease} from '../../releases/__fixtures__/release.fixture'
import {
  mockUseScheduleDraftOperations,
  useScheduleDraftOperationsMockReturn,
} from '../hooks/__mocks__/useScheduleDraftOperations.mock'
import {useScheduledDraftDocument} from '../hooks/useScheduledDraftDocument'
import {DeleteScheduledDraftDialog} from './DeleteScheduledDraftDialog'

vi.mock('../hooks/useScheduledDraftDocument')
vi.mock('../hooks/useScheduleDraftOperations')
vi.mock('../../preview/useObserveDocument')
vi.mock('../../hooks/useSchema', async () => {
  const actual = await vi.importActual('../../hooks/useSchema')
  return {
    ...actual,
    useSchema: vi.fn(),
  }
})

const mockUseScheduledDraftDocument = useScheduledDraftDocument as MockedFunction<
  typeof useScheduledDraftDocument
>
const mockUseUnstableObserveDocument = useUnstableObserveDocument as MockedFunction<
  typeof useUnstableObserveDocument
>
const mockUseSchema = useSchema as MockedFunction<typeof useSchema>

// `_system.base` is absent from the repo's `DocumentSystem` type, so fixtures carrying it cannot
// be typed as documents directly.
const asDocument = (document: object) => document as unknown as SanityDocument

const DRAFT_ID = 'drafts.article-123'
const VERSION_ID = 'versions.rScheduled.article-123'

const scheduledDraft = {
  _id: VERSION_ID,
  _type: 'article',
  _rev: 'scheduled-rev-123',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _system: {base: {id: DRAFT_ID, rev: 'base-rev-456'}},
  title: 'Test Article',
}

// Sits at exactly the revision the scheduled draft was branched from.
const draftAtBaseRevision = {
  _id: DRAFT_ID,
  _type: 'article',
  _rev: 'base-rev-456',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  title: 'Test Article',
}

const draftWithOwnEdits = {
  ...draftAtBaseRevision,
  _rev: 'draft-rev-789',
  title: 'Draft article',
}

const draftMatchedByHandAfterScheduling = {
  ...draftAtBaseRevision,
  _rev: 'draft-rev-999',
  _createdAt: '2024-01-04T00:00:00Z',
  _updatedAt: '2024-01-03T00:00:00Z',
}

const scheduledDraftEditedWhilePaused = {
  ...scheduledDraft,
  _rev: 'scheduled-rev-edited',
  _updatedAt: '2024-01-02T00:00:00Z',
  title: 'Edited while paused',
}

// `useScheduledDraftDocument` returns documents decorated by `useBundleDocuments`. Comparing
// against one of those instead of the raw version document made "already up to date" unreachable.
const decorated = (document: object) =>
  asDocument({...document, publishedDocumentExists: true, draftDocumentExists: false})

const mockSchema = {
  get: vi.fn().mockReturnValue({name: 'article', title: 'Article', type: 'document'}),
} as unknown as ReturnType<typeof useSchema>

// Mirrors the real hook: `{loading: true, document: null}` until the first emission, then the
// observable's `undefined` for an id the batch fetch did not return.
function mockObservedDocuments(
  documents: Record<string, object | undefined>,
  loadingIds: string[] = [],
) {
  mockUseUnstableObserveDocument.mockImplementation((documentId: string) =>
    loadingIds.includes(documentId)
      ? {document: null, loading: true}
      : {
          document: documents[documentId] as SanityDocument | undefined as SanityDocument | null,
          loading: false,
        },
  )
}

describe('DeleteScheduledDraftDialog', () => {
  let TestProvider: React.ComponentType<{children: React.ReactNode}>
  const mockOnClose = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    mockUseScheduleDraftOperations.mockReturnValue(useScheduleDraftOperationsMockReturn)
    useScheduleDraftOperationsMockReturn.deleteScheduledDraft.mockResolvedValue(undefined)
    mockUseSchema.mockReturnValue(mockSchema)
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: decorated(scheduledDraft),
      firstDocumentPreview: {title: scheduledDraft.title},
      firstDocumentValidation: undefined,
      documentsCount: 1,
      loading: false,
      error: null,
      previewLoading: false,
    })
    mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftAtBaseRevision})
    TestProvider = await createTestProvider()
  })

  it('no draft exists: shows "will save to draft" message and copies on delete', async () => {
    mockObservedDocuments({[VERSION_ID]: scheduledDraft})

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

  it('same content: shows "already up to date" message and skips copy', async () => {
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

  it('scheduled draft edited while paused: offers the copy checkbox even though the draft revision still matches the base revision', async () => {
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: decorated(scheduledDraftEditedWhilePaused),
      firstDocumentPreview: {title: scheduledDraftEditedWhilePaused.title},
      firstDocumentValidation: undefined,
      documentsCount: 1,
      loading: false,
      error: null,
      previewLoading: false,
    })
    mockObservedDocuments({
      [VERSION_ID]: scheduledDraftEditedWhilePaused,
      [DRAFT_ID]: draftAtBaseRevision,
    })

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
      screen.getByText('Your scheduled draft has different changes than your current draft.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        true,
        'article-123',
      )
    })
  })

  it('draft edited: shows checkbox (checked by default) and copies when checked', async () => {
    mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits})

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
    expect(screen.getByRole('checkbox')).toBeChecked()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        true,
        'article-123',
      )
    })
  })

  it('draft edited: skips copy when checkbox unchecked', async () => {
    mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits})

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

  it('content matches although the revisions and timestamps differ: skips copy', async () => {
    mockObservedDocuments({
      [VERSION_ID]: scheduledDraft,
      [DRAFT_ID]: draftMatchedByHandAfterScheduling,
    })

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
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        false,
        'article-123',
      )
    })
  })

  it('scheduled draft could not be read: copies rather than claiming the draft is up to date', async () => {
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: undefined,
      firstDocumentPreview: undefined,
      firstDocumentValidation: undefined,
      documentsCount: 0,
      loading: false,
      error: null,
      previewLoading: false,
    })
    mockObservedDocuments({[DRAFT_ID]: draftAtBaseRevision})

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
      screen.queryByText('Delete this scheduled draft? Your draft is already up to date.'),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('Yes, delete schedule'))

    await waitFor(() => {
      expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalledWith(
        scheduledRelease._id,
        true,
        'article-123',
      )
    })
  })

  it.each([
    ['the scheduled draft', VERSION_ID],
    ['the draft', DRAFT_ID],
  ])('while %s is still loading: disables confirm and classifies nothing', async (_label, id) => {
    mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits}, [id])

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

    expect(screen.queryByText('Delete this scheduled draft?')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Delete this scheduled draft? Your draft is already up to date.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Delete this scheduled draft? Your changes will be saved to draft.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Yes, delete schedule'})).toBeDisabled()

    expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).not.toHaveBeenCalled()
  })

  it('empty release: shows "already up to date" message and skips copy', async () => {
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: undefined,
      firstDocumentPreview: undefined,
      firstDocumentValidation: undefined,
      documentsCount: 0,
      loading: false,
      error: null,
      previewLoading: false,
    })

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

  describe('onDeleteComplete callback', () => {
    it('calls onDeleteComplete after a successful delete', async () => {
      const mockOnDeleteComplete = vi.fn()
      mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits})

      render(
        <TestProvider>
          <DeleteScheduledDraftDialog
            documentId="article-123"
            documentType="article"
            release={scheduledRelease}
            onClose={mockOnClose}
            onDeleteComplete={mockOnDeleteComplete}
          />
        </TestProvider>,
      )

      await userEvent.click(screen.getByText('Yes, delete schedule'))

      await waitFor(() => {
        expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalled()
      })
      expect(mockOnDeleteComplete).toHaveBeenCalledOnce()
    })

    it('calls onDeleteComplete after onClose on successful delete', async () => {
      const callOrder: string[] = []
      const mockOnDeleteComplete = vi.fn(() => callOrder.push('onDeleteComplete'))
      const onClose = vi.fn(() => callOrder.push('onClose'))
      mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits})

      render(
        <TestProvider>
          <DeleteScheduledDraftDialog
            documentId="article-123"
            documentType="article"
            release={scheduledRelease}
            onClose={onClose}
            onDeleteComplete={mockOnDeleteComplete}
          />
        </TestProvider>,
      )

      await userEvent.click(screen.getByText('Yes, delete schedule'))

      await waitFor(() => {
        expect(mockOnDeleteComplete).toHaveBeenCalledOnce()
      })
      expect(callOrder).toEqual(['onClose', 'onDeleteComplete'])
    })

    it('does not call onDeleteComplete when the delete operation fails', async () => {
      const mockOnDeleteComplete = vi.fn()
      useScheduleDraftOperationsMockReturn.deleteScheduledDraft.mockRejectedValue(
        new Error('delete failed'),
      )
      mockObservedDocuments({[VERSION_ID]: scheduledDraft, [DRAFT_ID]: draftWithOwnEdits})

      render(
        <TestProvider>
          <DeleteScheduledDraftDialog
            documentId="article-123"
            documentType="article"
            release={scheduledRelease}
            onClose={mockOnClose}
            onDeleteComplete={mockOnDeleteComplete}
          />
        </TestProvider>,
      )

      await userEvent.click(screen.getByText('Yes, delete schedule'))

      await waitFor(() => {
        expect(useScheduleDraftOperationsMockReturn.deleteScheduledDraft).toHaveBeenCalled()
      })
      expect(mockOnDeleteComplete).not.toHaveBeenCalled()
    })
  })
})
