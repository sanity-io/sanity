import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {usePerspective} from 'sanity'
import {type Mock, beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../../../../components'
import {CopyDocumentActions} from '../CopyDocumentActions'

const mockResolveIntentLink = vi.hoisted(() => vi.fn(() => '/mock-intent-link'))
const mockBuildStudioUrl = vi.hoisted(() =>
  vi.fn(({studio}: {studio?: (url: string) => string}) => studio?.('http://localhost:3333') ?? ''),
)
const mockPushToast = vi.hoisted(() => vi.fn())
const mockTelemetryLog = vi.hoisted(() => vi.fn())
const mockClipboardWriteText = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('sanity', () => ({
  getDraftId: (id: string) => `drafts.${id}`,
  getVersionId: (id: string, releaseId: string) => `versions.${releaseId}.${id}`,
  usePerspective: vi.fn(() => ({
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedPerspective: 'drafts',
    perspectiveStack: ['drafts'],
    excludedPerspectives: [],
  })),
  useStudioUrl: vi.fn(() => ({
    studioUrl: 'http://localhost:3333',
    buildStudioUrl: mockBuildStudioUrl,
  })),
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
}))

vi.mock('sanity/router', () => ({
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

vi.mock('../../../../../i18n', () => ({
  structureLocaleNamespace: 'structure',
}))

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(() => ({
    documentId: 'doc-123',
    documentType: 'article',
  })),
}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockTelemetryLog})),
}))

vi.mock('@sanity/ui', () => ({
  Menu: ({children}: {children: React.ReactNode}) => <div data-testid="menu">{children}</div>,
  useToast: vi.fn(() => ({push: mockPushToast})),
}))

vi.mock('../../../../../../ui-components', () => ({
  Button: (props: Record<string, unknown>) => (
    <button data-testid={props['data-testid'] as string} type="button">
      button
    </button>
  ),
  MenuButton: ({button, menu}: {button: React.ReactNode; menu: React.ReactNode}) => (
    <div data-testid="menu-button">
      {button}
      {menu}
    </div>
  ),
  MenuItem: (props: {'onClick'?: () => void; 'text'?: string; 'data-testid'?: string}) => (
    <button data-testid={props['data-testid']} onClick={props.onClick} type="button">
      {props.text}
    </button>
  ),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock

describe('CopyDocumentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {writeText: mockClipboardWriteText},
    })

    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
      selectedPerspective: 'drafts',
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
    })

    mockUsePaneRouter.mockReturnValue({
      params: {},
      setParams: vi.fn(),
    })

    mockBuildStudioUrl.mockImplementation(
      ({studio}: {studio?: (url: string) => string}) => studio?.('http://localhost:3333') ?? '',
    )
  })

  describe('Copy link to document', () => {
    it('copies URL with no perspective param for drafts', async () => {
      mockResolveIntentLink.mockReturnValue('/intent/edit/id=doc-123;type=article')

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-link-to-document'))

      expect(mockResolveIntentLink).toHaveBeenCalledWith(
        'edit',
        {id: 'doc-123', type: 'article'},
        [],
      )
    })

    it('copies URL with perspective param for release', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
        excludedPerspectives: [],
      })

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-link-to-document'))

      expect(mockResolveIntentLink).toHaveBeenCalledWith('edit', {id: 'doc-123', type: 'article'}, [
        ['perspective', 'rMyRelease'],
      ])
    })

    it('copies URL with scheduledDraft intent param for scheduled drafts', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rScheduled',
        selectedReleaseId: 'rScheduled',
        selectedPerspective: 'rScheduled',
        perspectiveStack: ['rScheduled', 'drafts'],
        excludedPerspectives: [],
      })

      mockUsePaneRouter.mockReturnValue({
        params: {scheduledDraft: 'rScheduled'},
        setParams: vi.fn(),
      })

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-link-to-document'))

      expect(mockResolveIntentLink).toHaveBeenCalledWith(
        'edit',
        {id: 'doc-123', type: 'article', scheduledDraft: 'rScheduled'},
        [],
      )
    })

    it('writes the constructed URL to clipboard', async () => {
      mockResolveIntentLink.mockReturnValue('/intent/edit/id=doc-123;type=article')
      mockBuildStudioUrl.mockReturnValue(
        'http://localhost:3333/intent/edit/id=doc-123;type=article',
      )

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-link-to-document'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith(
        'http://localhost:3333/intent/edit/id=doc-123;type=article',
      )
    })

    it('shows a toast after copying the URL', async () => {
      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-link-to-document'))
      await vi.waitFor(() => {
        expect(mockPushToast).toHaveBeenCalledWith({
          id: 'copy-document-url',
          status: 'info',
          title: 'panes.document-operation-results.operation-success_copy-url',
        })
      })
    })

    it('logs DocumentURLCopied telemetry event', async () => {
      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-link-to-document'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'DocumentURLCopied'}),
      )
    })
  })

  describe('Copy document ID', () => {
    it('copies drafts.{docId} for drafts perspective', async () => {
      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-document-id'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('drafts.doc-123')
    })

    it('copies {docId} for published perspective', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'published',
        selectedReleaseId: undefined,
        selectedPerspective: 'published',
        perspectiveStack: ['published'],
        excludedPerspectives: [],
      })

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-document-id'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('doc-123')
    })

    it('copies versions.{releaseId}.{docId} for release perspective', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
        excludedPerspectives: [],
      })

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-document-id'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('versions.rMyRelease.doc-123')
    })

    it('copies versions.{releaseId}.{docId} for scheduled draft', async () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rScheduled',
        selectedReleaseId: 'rScheduled',
        selectedPerspective: 'rScheduled',
        perspectiveStack: ['rScheduled', 'drafts'],
        excludedPerspectives: [],
      })

      mockUsePaneRouter.mockReturnValue({
        params: {scheduledDraft: 'rScheduled'},
        setParams: vi.fn(),
      })

      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-document-id'))

      expect(mockClipboardWriteText).toHaveBeenCalledWith('versions.rScheduled.doc-123')
    })

    it('shows a toast after copying the ID', async () => {
      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-document-id'))
      await vi.waitFor(() => {
        expect(mockPushToast).toHaveBeenCalledWith({
          id: 'copy-document-id',
          status: 'info',
          title: 'panes.document-operation-results.operation-success_copy-id',
        })
      })
    })

    it('logs DocumentIDCopied telemetry event', async () => {
      render(<CopyDocumentActions />)
      await userEvent.click(screen.getByTestId('copy-document-id'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'DocumentIDCopied'}),
      )
    })
  })
})
