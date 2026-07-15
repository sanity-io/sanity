import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {usePerspective, useTargetDocumentState} from 'sanity'
import {type Mock, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../../../components'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {useDocumentPaneInfo} from '../../../useDocumentPaneInfo'
import {CopyDocumentActions} from '../CopyDocumentActions'

const mockResolveIntentLink = vi.hoisted(() => vi.fn(() => '/mock-intent-link'))
const mockBuildIntentUrl = vi.hoisted(() =>
  vi.fn((intentLink: string) => `http://localhost:3333${intentLink}`),
)
const mockTelemetryLog = vi.hoisted(() => vi.fn())
const mockClipboardWriteText = vi.hoisted(() => vi.fn(() => Promise.resolve()))

const DEFAULT_PERSPECTIVE = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts' as const,
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
}

const READY_TARGET_STATE = {
  status: 'ready' as const,
  targetDocument: undefined,
  scopeId: undefined,
  variant: undefined,
}

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: vi.fn(() => DEFAULT_PERSPECTIVE),
  useTargetDocumentState: vi.fn(() => READY_TARGET_STATE),
  useStudioUrl: vi.fn(() => ({
    studioUrl: 'http://localhost:3333',
    buildIntentUrl: mockBuildIntentUrl,
  })),
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    state: {},
    resolveIntentLink: mockResolveIntentLink,
  })),
}))

vi.mock('../../../../../components', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

vi.mock('../../../useDocumentPane')

vi.mock('../../../useDocumentPaneInfo')

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockTelemetryLog})),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock
const mockUseDocumentPaneInfo = useDocumentPaneInfo as Mock
const mockUseDocumentPane = useDocumentPane as Mock
const mockUseTargetDocumentState = useTargetDocumentState as Mock

const EXISTING_EDIT_STATE = {
  ready: true,
  scopeId: undefined,
  draft: {_id: 'drafts.doc-123'},
  published: {_id: 'doc-123'},
  version: null,
}

const EXISTING_DISPLAYED = {
  _id: 'drafts.doc-123',
  _type: 'article',
  _createdAt: '2026-01-01T00:00:00Z',
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })
})

describe('CopyDocumentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {writeText: mockClipboardWriteText},
    })

    mockUsePerspective.mockReturnValue(DEFAULT_PERSPECTIVE)
    mockUsePaneRouter.mockReturnValue({params: {}, setParams: vi.fn()})
    mockUseDocumentPaneInfo.mockReturnValue({
      documentType: 'article',
      documentId: 'doc-123',
      schemaType: {liveEdit: false},
    })
    mockUseDocumentPane.mockReturnValue({
      documentId: 'doc-123',
      documentType: 'article',
      editState: EXISTING_EDIT_STATE,
      displayed: EXISTING_DISPLAYED,
    })
    mockUseTargetDocumentState.mockReturnValue(READY_TARGET_STATE)
  })

  async function clickMenuItem(testId: string) {
    await userEvent.click(screen.getByTestId('copy-document-actions-button'))
    await userEvent.click(await screen.findByTestId(testId))
  }

  describe('Copy link to document', () => {
    it('copies URL with no perspective param for drafts', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-link-to-document')

      expect(mockResolveIntentLink).toHaveBeenCalledWith(
        'edit',
        {id: 'doc-123', type: 'article'},
        [],
      )
    })

    it('copies URL with perspective param for release', async () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-link-to-document')

      expect(mockResolveIntentLink).toHaveBeenCalledWith('edit', {id: 'doc-123', type: 'article'}, [
        ['perspective', 'rMyRelease'],
      ])
    })

    it('copies URL with scheduledDraft intent param for scheduled drafts', async () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rScheduled',
        selectedReleaseId: 'rScheduled',
        selectedPerspective: 'rScheduled',
        perspectiveStack: ['rScheduled', 'drafts'],
      })

      mockUsePaneRouter.mockReturnValue({
        params: {scheduledDraft: 'rScheduled'},
        setParams: vi.fn(),
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-link-to-document')

      expect(mockResolveIntentLink).toHaveBeenCalledWith(
        'edit',
        {id: 'doc-123', type: 'article', scheduledDraft: 'rScheduled'},
        [],
      )
    })

    it('writes the constructed URL to clipboard', async () => {
      mockResolveIntentLink.mockReturnValue('/intent/edit/id=doc-123;type=article')

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-link-to-document')

      expect(mockBuildIntentUrl).toHaveBeenCalledWith('/intent/edit/id=doc-123;type=article')
      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        'http://localhost:3333/intent/edit/id=doc-123;type=article',
      )
    })

    it('shows a toast after copying the URL', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-link-to-document')

      expect(
        await screen.findByText('panes.document-operation-results.operation-success_copy-url'),
      ).toBeInTheDocument()
    })

    it('logs DocumentURLCopied telemetry event', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-link-to-document')

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Document URL Copied'}),
      )
    })
  })

  describe('Copy document ID', () => {
    it('copies drafts.{docId} for drafts perspective', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('drafts.doc-123')
    })

    it('copies {docId} for live edit document types', async () => {
      mockUseDocumentPaneInfo.mockReturnValue({
        documentType: 'settings',
        documentId: 'doc-123',
        schemaType: {liveEdit: true},
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('doc-123')
    })

    it('copies {docId} for published perspective', async () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'published',
        selectedPerspective: 'published',
        perspectiveStack: ['published'],
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('doc-123')
    })

    it('copies versions.{releaseId}.{docId} for release perspective', async () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('versions.rMyRelease.doc-123')
    })

    it('copies versions.{releaseId}.{docId} for scheduled draft', async () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rScheduled',
        selectedReleaseId: 'rScheduled',
        selectedPerspective: 'rScheduled',
        perspectiveStack: ['rScheduled', 'drafts'],
      })

      mockUsePaneRouter.mockReturnValue({
        params: {scheduledDraft: 'rScheduled'},
        setParams: vi.fn(),
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('versions.rScheduled.doc-123')
    })

    it('shows a toast after copying the ID', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(
        await screen.findByText('panes.document-operation-results.operation-success_copy-id'),
      ).toBeInTheDocument()
    })

    it('logs DocumentIDCopied telemetry event', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Document ID Copied'}),
      )
    })
  })

  describe('Disabled state', () => {
    it('disables the button when a release is pinned but the version does not exist', () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: 'rMyRelease',
          draft: null,
          published: {_id: 'doc-123'},
          version: null,
        },
        displayed: EXISTING_DISPLAYED,
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).toBeDisabled()
    })

    it('stays enabled when creating a new document inside a release', () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: 'rMyRelease',
          draft: null,
          published: null,
          version: null,
        },
        displayed: {_id: 'versions.rMyRelease.doc-123', _type: 'article'},
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).not.toBeDisabled()
    })

    it('enables the button when the pinned release contains the version', () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: 'rMyRelease',
          draft: null,
          published: null,
          version: {_id: 'versions.rMyRelease.doc-123'},
        },
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).not.toBeDisabled()
    })

    it('disables the button when the selected variant does not exist', () => {
      mockUseTargetDocumentState.mockReturnValue({
        status: 'variant-missing',
        variant: {_id: 'variant-1'},
        bundle: 'published',
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: undefined,
          draft: null,
          published: {_id: 'doc-123'},
          version: null,
        },
        displayed: {_id: 'doc-123', _type: 'article'},
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).toBeDisabled()
    })

    it('disables the button when the selected variant definition is not found', () => {
      mockUseTargetDocumentState.mockReturnValue({
        status: 'variant-definition-document-not-found',
        requestedVariantName: 'unknown-variant',
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: undefined,
          draft: null,
          published: {_id: 'doc-123'},
          version: null,
        },
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).toBeDisabled()
    })

    it('enables the button when the selected variant exists', () => {
      mockUseTargetDocumentState.mockReturnValue({
        status: 'ready',
        targetDocument: {_id: 'versions.v1a2b3c4.doc-123'},
        scopeId: 'v1a2b3c4',
        variant: {_id: 'variant-1'},
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: 'v1a2b3c4',
          draft: null,
          published: null,
          version: {_id: 'versions.v1a2b3c4.doc-123'},
        },
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).not.toBeDisabled()
    })

    it('stays enabled on the drafts perspective when no draft exists (pseudo-draft)', () => {
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: true,
          scopeId: undefined,
          draft: null,
          published: {_id: 'doc-123'},
          version: null,
        },
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).not.toBeDisabled()
    })

    it('stays enabled while the edit state is not yet ready', () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })
      mockUseDocumentPane.mockReturnValue({
        documentId: 'doc-123',
        documentType: 'article',
        editState: {
          ready: false,
          scopeId: 'rMyRelease',
          draft: null,
          published: null,
          version: null,
        },
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).not.toBeDisabled()
    })
  })
})
