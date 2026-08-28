import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {usePerspective, useTargetDocumentState} from 'sanity'
import {type Mock, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../../../components/paneRouter/usePaneRouter'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
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

const DRAFT_SIBLING = {_id: 'drafts.doc-123'}
const PUBLISHED_SIBLING = {_id: 'doc-123'}
const RELEASE_SIBLING = {_id: 'versions.rMyRelease.doc-123'}
const SCHEDULED_SIBLING = {_id: 'versions.rScheduled.doc-123'}

function readyTarget(
  siblings: {
    published?: {_id: string; _system?: {draft?: {_ref: string}; variant?: {_ref: string}}}
    draft?: {_id: string}
    version?: {_id: string}
  } = {},
) {
  return {
    status: 'ready' as const,
    targetDocument: siblings.draft ?? siblings.published ?? siblings.version,
    scopeId: undefined,
    variant: undefined,
    siblings: {
      published: undefined,
      draft: undefined,
      version: undefined,
      ...siblings,
    },
  }
}

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: vi.fn(() => DEFAULT_PERSPECTIVE),
  useTargetDocumentState: vi.fn(() => readyTarget({draft: DRAFT_SIBLING})),
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

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

vi.mock('../../../useDocumentPaneInfo')

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockTelemetryLog})),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock
const mockUseDocumentPaneInfo = useDocumentPaneInfo as Mock
const mockUseTargetDocumentState = useTargetDocumentState as Mock

let wrapper: React.ComponentType<{children: React.ReactNode}>

async function clickMenuItem(testId: string) {
  await userEvent.click(screen.getByTestId('copy-document-actions-button'))
  await userEvent.click(await screen.findByTestId(testId))
}

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
    mockUseTargetDocumentState.mockReturnValue(
      readyTarget({draft: DRAFT_SIBLING, published: PUBLISHED_SIBLING}),
    )
  })

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
      mockUseTargetDocumentState.mockReturnValue(readyTarget({version: RELEASE_SIBLING}))

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
      mockUseTargetDocumentState.mockReturnValue(readyTarget({version: SCHEDULED_SIBLING}))

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
    it('copies the draft sibling id on the drafts perspective', async () => {
      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('drafts.doc-123')
    })

    it('copies the published sibling id for live edit document types', async () => {
      mockUseDocumentPaneInfo.mockReturnValue({
        documentType: 'settings',
        documentId: 'doc-123',
        schemaType: {liveEdit: true},
      })

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('doc-123')
    })

    it('copies the published sibling id on the published perspective', async () => {
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

    it('copies the version sibling id on a release perspective', async () => {
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })
      mockUseTargetDocumentState.mockReturnValue(readyTarget({version: RELEASE_SIBLING}))

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('versions.rMyRelease.doc-123')
    })

    it('copies the version sibling id for a scheduled draft', async () => {
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
      mockUseTargetDocumentState.mockReturnValue(readyTarget({version: SCHEDULED_SIBLING}))

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('versions.rScheduled.doc-123')
    })

    it('copies the constructed drafts id when published is shown on the draft perspective', async () => {
      mockUseTargetDocumentState.mockReturnValue(readyTarget({published: PUBLISHED_SIBLING}))

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith('drafts.doc-123')
    })

    it('copies the advertised draft id when a published variant is shown on the draft perspective', async () => {
      const advertisedDraftId = 'versions.varscope.doc-123'
      mockUseTargetDocumentState.mockReturnValue(
        readyTarget({
          published: {
            _id: 'versions.varscopePub.doc-123',
            _system: {
              variant: {_ref: 'variant-1'},
              draft: {_ref: advertisedDraftId},
            },
          },
        }),
      )

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith(advertisedDraftId)
    })

    it('copies the lane draft sibling id when a variant draft exists', async () => {
      const variantDraftId = 'versions.varscope.doc-123'
      mockUseTargetDocumentState.mockReturnValue(readyTarget({draft: {_id: variantDraftId}}))

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith(variantDraftId)
    })

    it('copies the lane published sibling id when a variant is published', async () => {
      const variantPublishedId = 'versions.varscopePub.doc-123'
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'published',
        selectedPerspective: 'published',
        perspectiveStack: ['published'],
      })
      mockUseTargetDocumentState.mockReturnValue(
        readyTarget({published: {_id: variantPublishedId}}),
      )

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith(variantPublishedId)
    })

    it('copies the lane version sibling id when a variant exists in a release', async () => {
      const variantVersionId = 'versions.varscopeRel.doc-123'
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: 'rMyRelease',
        selectedReleaseId: 'rMyRelease',
        selectedPerspective: 'rMyRelease',
        perspectiveStack: ['rMyRelease', 'drafts'],
      })
      mockUseTargetDocumentState.mockReturnValue(readyTarget({version: {_id: variantVersionId}}))

      render(<CopyDocumentActions />, {wrapper})
      await clickMenuItem('copy-document-id')

      expect(mockClipboardWriteText).toHaveBeenCalledWith(variantVersionId)
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

  describe('Visibility', () => {
    const pinRelease = (releaseId: string) =>
      mockUsePerspective.mockReturnValue({
        ...DEFAULT_PERSPECTIVE,
        selectedPerspectiveName: releaseId,
        selectedReleaseId: releaseId,
        selectedPerspective: releaseId,
        perspectiveStack: [releaseId, 'drafts'],
      })

    it('hides the button when the current lane sibling does not exist', () => {
      pinRelease('rMyRelease')
      mockUseTargetDocumentState.mockReturnValue(
        readyTarget({published: PUBLISHED_SIBLING, draft: DRAFT_SIBLING}),
      )

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.queryByTestId('copy-document-actions-button')).not.toBeInTheDocument()
    })

    it('shows the button when the current lane sibling exists', () => {
      pinRelease('rMyRelease')
      mockUseTargetDocumentState.mockReturnValue(readyTarget({version: RELEASE_SIBLING}))

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).toBeInTheDocument()
    })

    it('hides the button when the selected variant has no siblings', () => {
      mockUseTargetDocumentState.mockReturnValue({
        status: 'variant-missing',
        variant: {_id: 'variant-1'},
        bundle: 'published',
        siblings: {published: undefined, draft: undefined, version: undefined},
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.queryByTestId('copy-document-actions-button')).not.toBeInTheDocument()
    })

    it('hides the button when the selected variant definition is not found', () => {
      mockUseTargetDocumentState.mockReturnValue({
        status: 'variant-definition-document-not-found',
        requestedVariantName: 'unknown-variant',
      })

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.queryByTestId('copy-document-actions-button')).not.toBeInTheDocument()
    })

    it('hides the button while the target is still resolving', () => {
      mockUseTargetDocumentState.mockReturnValue({status: 'resolving'})

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.queryByTestId('copy-document-actions-button')).not.toBeInTheDocument()
    })

    it('hides the button for a new unpublished document with no siblings', () => {
      mockUseTargetDocumentState.mockReturnValue(readyTarget())

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.queryByTestId('copy-document-actions-button')).not.toBeInTheDocument()
    })

    it('shows the button when published is shown on the draft perspective', () => {
      mockUseTargetDocumentState.mockReturnValue(readyTarget({published: PUBLISHED_SIBLING}))

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.getByTestId('copy-document-actions-button')).toBeInTheDocument()
    })

    it('hides the button when a published variant has no advertised draft id', () => {
      mockUseTargetDocumentState.mockReturnValue(
        readyTarget({
          published: {
            _id: 'versions.varscopePub.doc-123',
            _system: {variant: {_ref: 'variant-1'}},
          },
        }),
      )

      render(<CopyDocumentActions />, {wrapper})

      expect(screen.queryByTestId('copy-document-actions-button')).not.toBeInTheDocument()
    })
  })
})
