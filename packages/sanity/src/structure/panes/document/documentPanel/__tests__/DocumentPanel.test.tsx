import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {useStructureTool} from '../../../../useStructureTool'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPanel} from '../DocumentPanel'

vi.mock('../../../../components/pane/usePane', () => ({
  usePane: vi.fn(() => ({collapsed: false})),
}))

vi.mock('../../../../components/pane/usePaneLayout', () => ({
  usePaneLayout: vi.fn(() => ({collapsed: false})),
}))

vi.mock('../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({params: {}})),
}))

vi.mock('../../../../useStructureTool', () => ({
  useStructureTool: vi.fn(() => ({features: {resizablePanes: true, splitPanes: true}})),
}))

vi.mock('../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../../hasObsoleteDraft', () => ({
  hasObsoleteDraft: vi.fn(() => ({result: false})),
}))

vi.mock('../../../../mustChooseNewDocumentDestination', () => ({
  mustChooseNewDocumentDestination: vi.fn(() => false),
}))

vi.mock('../header/DocumentPanelSubHeader', () => ({
  DocumentPanelSubHeader: () => null,
}))

vi.mock('../documentViews/FormView', async () => {
  const {useState} = await import('react')
  const {createPortal} = await import('react-dom')
  const {usePortal} = await import('@sanity/ui')

  return {
    FormView: function MockFormView() {
      const [count, setCount] = useState(0)
      const portal = usePortal()
      return (
        <div data-testid="document-panel-scroller">
          <button
            type="button"
            data-testid="form-state"
            onClick={() => setCount((value) => value + 1)}
          >
            {count}
          </button>
          {portal.element
            ? createPortal(<div data-testid="fullscreen-pte">fullscreen</div>, portal.element)
            : null}
        </div>
      )
    },
  }
})

vi.mock('../../documentInspector/DocumentInspectorPanel', () => ({
  DocumentInspectorPanel: () => <aside data-ui="DocumentInspectorPanel">Inspector</aside>,
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useArchivedReleases: vi.fn(() => ({data: []})),
  useFilteredReleases: vi.fn(() => ({currentReleases: [], notCurrentReleases: []})),
  usePausedScheduledDraft: vi.fn(() => ({isPaused: false})),
}))

const mockUseDocumentPane = vi.mocked(useDocumentPane)
const mockUseStructureTool = vi.mocked(useStructureTool)

const splitPanesFeatures = {resizablePanes: true, splitPanes: true}
const collapsedLayoutFeatures = {resizablePanes: false, splitPanes: false}

function documentPaneValue() {
  return {
    activeViewId: 'form',
    displayed: {_id: 'doc-1', _type: 'simpleBlock'},
    documentId: 'doc-1',
    editState: {ready: true, draft: null, published: null, version: undefined},
    inspector: {name: 'sanity/comments', component: () => null},
    value: {_id: 'doc-1', _type: 'simpleBlock', _createdAt: '2020-01-01T00:00:00Z'},
    views: [{id: 'form', type: 'form'}],
    ready: true,
    schemaType: {name: 'simpleBlock'},
    permissions: {granted: true},
    isPermissionsLoading: true,
    targetDocumentState: {status: 'ready', targetDocument: {_id: 'doc-1'}},
  } as unknown as ReturnType<typeof useDocumentPane>
}

function renderDocumentPanel() {
  return (
    <DocumentPanel
      footerHeight={0}
      headerHeight={0}
      isInspectOpen={false}
      rootElement={null}
      setDocumentPanelPortalElement={vi.fn()}
      footer={<div />}
    />
  )
}

async function renderPanel() {
  mockUseDocumentPane.mockReturnValue(documentPaneValue())
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  return render(renderDocumentPanel(), {wrapper})
}

describe('DocumentPanel form persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStructureTool.mockReturnValue({
      features: splitPanesFeatures,
    } as ReturnType<typeof useStructureTool>)
  })

  it('keeps the form mounted when an inspector takes over a collapsed layout', async () => {
    const {rerender} = await renderPanel()

    await userEvent.click(screen.getByTestId('form-state'))
    expect(screen.getByTestId('form-state')).toHaveTextContent('1')
    expect(screen.getByTestId('document-panel-form-view')).toBeVisible()

    mockUseStructureTool.mockReturnValue({
      features: collapsedLayoutFeatures,
    } as ReturnType<typeof useStructureTool>)
    rerender(renderDocumentPanel())

    const formView = screen.getByTestId('document-panel-form-view')
    expect(formView).not.toBeVisible()
    expect(formView).toHaveAttribute('hidden')
    expect(screen.getByTestId('form-state')).toHaveTextContent('1')
    expect(screen.getByText('Inspector')).toBeVisible()

    const fullscreenPte = screen.getByTestId('fullscreen-pte')
    expect(formView).toContainElement(fullscreenPte)
    expect(fullscreenPte).not.toBeVisible()

    mockUseStructureTool.mockReturnValue({
      features: splitPanesFeatures,
    } as ReturnType<typeof useStructureTool>)
    rerender(renderDocumentPanel())

    expect(screen.getByTestId('document-panel-form-view')).toBeVisible()
    expect(screen.getByTestId('form-state')).toHaveTextContent('1')
    expect(screen.getByTestId('fullscreen-pte')).toBeVisible()
  })
})
