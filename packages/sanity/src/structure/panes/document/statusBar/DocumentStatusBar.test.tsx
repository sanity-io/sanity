import {render, screen} from '@testing-library/react'
import {PerspectiveContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {perspectiveContextValueMock} from '../../../__mocks__/usePerspective.mock'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentToolbarSlots} from '../document-layout/documentToolbarSlots'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBar} from './DocumentStatusBar'

vi.mock('../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({params: {}})),
}))

vi.mock('./useResizeObserver', async () => {
  const {useEffect} = await import('react')

  return {
    useResizeObserver: function useMockResizeObserver({
      onResize,
    }: {
      onResize: (event: ResizeObserverEntry) => void
    }) {
      useEffect(() => {
        onResize({contentRect: {width: 800}} as ResizeObserverEntry)
      }, [onResize])
    },
  }
})

vi.mock('./DocumentStatusLine', () => ({
  DocumentStatusLine: () => <div data-testid="default-status" />,
}))

vi.mock('./RevisionStatusLine', () => ({
  RevisionStatusLine: () => <div data-testid="default-revision-status" />,
}))

vi.mock('./DocumentBadges', () => ({
  DocumentBadges: () => <div data-testid="default-badges" />,
}))

vi.mock('./DocumentStatusBarActions', () => ({
  DocumentStatusBarActions: () => <div data-testid="default-actions" />,
  HistoryStatusBarActions: () => <div data-testid="default-history-actions" />,
}))

const mockUseDocumentPane = vi.mocked(useDocumentPane)

function documentPaneValue() {
  return {
    editState: {ready: true, draft: null, published: null, version: undefined},
    revisionNotFound: false,
    targetDocumentState: {status: 'ready', targetDocument: {_id: 'doc-1'}},
  } as unknown as ReturnType<typeof useDocumentPane>
}

async function renderStatusBar(slots?: DocumentToolbarSlots) {
  mockUseDocumentPane.mockReturnValue(documentPaneValue())
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(
    <PerspectiveContext.Provider value={perspectiveContextValueMock}>
      <DocumentStatusBar slots={slots} />
    </PerspectiveContext.Provider>,
    {wrapper},
  )
}

describe('DocumentStatusBar slots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the studio content for every slot by default', async () => {
    await renderStatusBar()

    expect(screen.getByTestId('default-status')).toBeInTheDocument()
    expect(screen.getByTestId('default-badges')).toBeInTheDocument()
    expect(screen.getByTestId('default-actions')).toBeInTheDocument()
  })

  it('renders a host component in place of the slot it is given', async () => {
    await renderStatusBar({
      documentActions: function HostActions() {
        return <div data-testid="host-actions" />
      },
    })

    expect(screen.getByTestId('host-actions')).toBeInTheDocument()
    expect(screen.queryByTestId('default-actions')).toBeNull()
    expect(screen.getByTestId('default-status')).toBeInTheDocument()
    expect(screen.getByTestId('default-badges')).toBeInTheDocument()
  })

  it('suppresses a slot whose component renders nothing', async () => {
    await renderStatusBar({
      documentStatus: function HiddenStatus() {
        return null
      },
    })

    expect(screen.queryByTestId('default-status')).toBeNull()
    expect(screen.getByTestId('default-actions')).toBeInTheDocument()
  })

  it('hands the studio content to the slot as renderDefault', async () => {
    await renderStatusBar({
      documentBadges: function WrappedBadges({renderDefault}) {
        return <div data-testid="host-badges">{renderDefault()}</div>
      },
    })

    expect(screen.getByTestId('host-badges')).toContainElement(screen.getByTestId('default-badges'))
  })
})
