import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {usePerspective} from 'sanity'
import {type Mock, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../../../components'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {CopyDocumentActions} from '../CopyDocumentActions'

const mockResolveIntentLink = vi.hoisted(() => vi.fn(() => '/mock-intent-link'))
const mockBuildStudioUrl = vi.hoisted(() =>
  vi.fn(({studio}: {studio?: (url: string) => string}) => studio?.('http://localhost:3333') ?? ''),
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

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: vi.fn(() => DEFAULT_PERSPECTIVE),
  useStudioUrl: vi.fn(() => ({
    studioUrl: 'http://localhost:3333',
    buildStudioUrl: mockBuildStudioUrl,
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

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(() => ({
    documentId: 'doc-123',
    documentType: 'article',
  })),
}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockTelemetryLog})),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock

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
        expect.objectContaining({name: 'DocumentURLCopied'}),
      )
    })
  })

  describe('Copy document ID', () => {
    it('copies drafts.{docId} for drafts perspective', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('drafts.doc-123')
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
        expect.objectContaining({name: 'DocumentIDCopied'}),
      )
    })
  })
})
