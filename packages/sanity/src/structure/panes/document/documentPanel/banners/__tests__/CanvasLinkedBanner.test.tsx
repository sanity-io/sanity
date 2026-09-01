import {render, screen, waitFor} from '@testing-library/react'
import {type DocumentActionsResolver, useCanvasCompanionDoc, useNavigateToCanvasDoc} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {CanvasLinkedBanner} from '../CanvasLinkedBanner'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useCanvasCompanionDoc: vi.fn(),
    useNavigateToCanvasDoc: vi.fn(),
  }
})

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>
const mockUseCanvasCompanionDoc = useCanvasCompanionDoc as Mock<typeof useCanvasCompanionDoc>
const mockUseNavigateToCanvasDoc = useNavigateToCanvasDoc as Mock<typeof useNavigateToCanvasDoc>

const companionDoc = {
  _id: 'companion1',
  canvasDocumentId: 'canvas1',
  studioDocumentId: 'drafts.doc1',
}

const renderBanner = async (documentActions?: DocumentActionsResolver) => {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: documentActions ? {document: {actions: documentActions}} : undefined,
  })

  return render(<CanvasLinkedBanner />, {wrapper})
}

function mockDocumentPane(displayedId = 'drafts.doc1') {
  mockUseDocumentPane.mockReturnValue({
    documentId: 'doc1',
    documentType: 'author',
    displayed: {_id: displayedId, _type: 'author'},
  } as ReturnType<typeof useDocumentPane>)
}

describe('CanvasLinkedBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDocumentPane()
    mockUseCanvasCompanionDoc.mockReturnValue({
      isLinked: true,
      isLockedByCanvas: true,
      companionDoc,
      loading: false,
    } as unknown as ReturnType<typeof useCanvasCompanionDoc>)
    mockUseNavigateToCanvasDoc.mockReturnValue(vi.fn())
  })

  it('shows the edit in canvas action when editInCanvas is configured', async () => {
    await renderBanner()

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="canvas-linked-banner"]')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: 'Edit in Canvas'})).toBeInTheDocument()
  })

  it('hides the edit in canvas action when editInCanvas is filtered out', async () => {
    await renderBanner((prev) => prev.filter(({action}) => action !== 'editInCanvas'))

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="canvas-linked-banner"]')).toBeInTheDocument()
    })
    expect(screen.getByText('This draft document is linked to Canvas')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Edit in Canvas'})).not.toBeInTheDocument()
  })

  it('keeps the informational banner when document.actions is empty', async () => {
    await renderBanner(() => [])

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="canvas-linked-banner"]')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', {name: 'Edit in Canvas'})).not.toBeInTheDocument()
  })

  it('shows the edit in canvas action when the displayed document is published', async () => {
    mockDocumentPane('doc1')

    await renderBanner()

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="canvas-linked-banner"]')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: 'Edit in Canvas'})).toBeInTheDocument()
  })

  it('shows the edit in canvas action when the displayed document is a version', async () => {
    mockDocumentPane('versions.rSchedule.doc1')

    await renderBanner()

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="canvas-linked-banner"]')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: 'Edit in Canvas'})).toBeInTheDocument()
  })
})
