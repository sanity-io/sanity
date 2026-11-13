import {PortalProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactElement} from 'react'
import {type PerspectiveContextValue, type ReleaseDocument, type SystemVariant} from 'sanity'
import {PerspectiveContext} from 'sanity/_singletons'
import {test as baseTest, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {perspectiveContextValueMock} from '../../../../__mocks__/usePerspective.mock'
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

vi.mock('../header/DocumentPanelSubHeader', () => ({
  DocumentPanelSubHeader: () => null,
}))

vi.mock('../../useDocumentTitle', () => ({
  useDocumentTitle: () => ({title: 'Test document'}),
}))

const portalBoundaryCapture = vi.hoisted(() => ({current: null as HTMLElement | null}))

vi.mock('../documentViews/FormView', async () => {
  const {useState} = await import('react')
  const {createPortal} = await import('react-dom')
  const {usePortal} = await import('@sanity/ui')
  const {usePortalBoundary} =
    await import('../../../../../core/components/portalBoundary/usePortalBoundary')

  return {
    FormView: function MockFormView() {
      const [count, setCount] = useState(0)
      const portal = usePortal()
      portalBoundaryCapture.current = usePortalBoundary()
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

// A portal element named by a provider above the document panel.
const ANCESTOR_PORTAL_ELEMENT = vi.hoisted(() => 'test-ancestor-portal')

// Portals by name, as `ConfirmDeleteDialog` in the document group inspector does.
vi.mock('../../documentInspector/DocumentInspectorPanel', async () => {
  const {Portal} = await import('@sanity/ui')
  const {DOCUMENT_PANEL_PORTAL_ELEMENT} = await import('../../../../constants')

  return {
    DocumentInspectorPanel: () => (
      <aside data-ui="DocumentInspectorPanel">
        Inspector
        <Portal __unstable_name={DOCUMENT_PANEL_PORTAL_ELEMENT}>
          <div data-testid="inspector-dialog">Inspector dialog</div>
        </Portal>
        <Portal __unstable_name={ANCESTOR_PORTAL_ELEMENT}>
          <div data-testid="inspector-ancestor-portal-content">Ancestor portal content</div>
        </Portal>
      </aside>
    ),
  }
})

vi.mock('../../../../../core/releases/store/useArchivedReleases', async (importOriginal) => ({
  ...(await importOriginal()),
  useArchivedReleases: vi.fn(() => ({data: []})),
}))
vi.mock('../../../../../core/hooks/useFilteredReleases', async (importOriginal) => ({
  ...(await importOriginal()),
  useFilteredReleases: vi.fn(() => ({currentReleases: [], notCurrentReleases: []})),
}))
vi.mock(
  '../../../../../core/singleDocRelease/hooks/usePausedScheduledDraft',
  async (importOriginal) => ({
    ...(await importOriginal()),
    usePausedScheduledDraft: vi.fn(() => ({isPaused: false})),
  }),
)

const mockUseDocumentPane = vi.mocked(useDocumentPane)
const mockUseStructureTool = vi.mocked(useStructureTool)

const publishedPerspectiveContextValue = {
  ...perspectiveContextValueMock,
  selectedPerspective: 'published' as const,
}

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

async function renderPanel(ui: ReactElement = renderDocumentPanel()) {
  mockUseDocumentPane.mockReturnValue(documentPaneValue())
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  return render(ui, {wrapper})
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

describe('DocumentPanel portal boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    portalBoundaryCapture.current = null
    mockUseStructureTool.mockReturnValue({
      features: splitPanesFeatures,
    } as ReturnType<typeof useStructureTool>)
  })

  it('declares the document scroll container as the boundary for portaled popovers', async () => {
    await renderPanel()

    // The real scroller wraps the (mocked) form view's stand-in, so it is the first match.
    const [scroller] = screen.getAllByTestId('document-panel-scroller')
    expect(portalBoundaryCapture.current).toBe(scroller)
  })
})

const inspectorPortalTest = baseTest
  .extend('features', () => splitPanesFeatures)
  .extend('renderPanelWithFeatures', ({features}) => {
    mockUseStructureTool.mockReturnValue({features} as ReturnType<typeof useStructureTool>)
    return renderPanel
  })

describe('DocumentPanel inspector portal', () => {
  inspectorPortalTest(
    'renders dialogs portaled from an inspector into the document panel portal',
    async ({renderPanelWithFeatures}) => {
      await renderPanelWithFeatures()

      expect(screen.getByTestId('document-panel-portal')).toContainElement(
        screen.getByTestId('inspector-dialog'),
      )
    },
  )

  inspectorPortalTest(
    'keeps portal elements named above the document panel reachable from an inspector',
    async ({renderPanelWithFeatures, onTestFinished}) => {
      const ancestorPortalElement = document.createElement('div')
      document.body.append(ancestorPortalElement)
      onTestFinished(() => ancestorPortalElement.remove())

      await renderPanelWithFeatures(
        <PortalProvider __unstable_elements={{[ANCESTOR_PORTAL_ELEMENT]: ancestorPortalElement}}>
          {renderDocumentPanel()}
        </PortalProvider>,
      )

      expect(ancestorPortalElement).toContainElement(
        screen.getByTestId('inspector-ancestor-portal-content'),
      )
      expect(screen.getByTestId('document-panel-portal')).toContainElement(
        screen.getByTestId('inspector-dialog'),
      )
    },
  )

  describe('in a collapsed layout', () => {
    inspectorPortalTest.override('features', () => collapsedLayoutFeatures)

    inspectorPortalTest(
      'renders dialogs portaled from an inspector outside the hidden form view when the inspector takes over a collapsed layout',
      async ({renderPanelWithFeatures}) => {
        await renderPanelWithFeatures()

        const inspectorDialog = screen.getByTestId('inspector-dialog')
        expect(screen.getByTestId('document-panel-form-view')).not.toContainElement(inspectorDialog)
        expect(inspectorDialog).toBeVisible()
      },
    )
  })
})

describe('DocumentPanel banners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStructureTool.mockReturnValue({
      features: splitPanesFeatures,
    } as ReturnType<typeof useStructureTool>)
  })

  function deletedDocumentPaneValue({isDeleted}: {isDeleted: boolean}) {
    return {
      ...documentPaneValue(),
      editState: {ready: true, draft: null, published: null, version: null},
      isDeleted,
      isDeleting: false,
    } as unknown as ReturnType<typeof useDocumentPane>
  }

  async function renderBanners() {
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    return render(
      <PerspectiveContext.Provider value={publishedPerspectiveContextValue}>
        {renderDocumentPanel()}
      </PerspectiveContext.Provider>,
      {wrapper},
    )
  }

  it('shows the deleted document banner alongside the choose destination banner', async () => {
    mockUseDocumentPane.mockReturnValue(deletedDocumentPaneValue({isDeleted: true}))

    await renderBanners()

    expect(screen.getByTestId('choose-new-document-destination-banner')).toBeInTheDocument()
    expect(screen.getByTestId('deleted-document-banner')).toBeInTheDocument()
  })

  it('shows only the choose destination banner when the document was never created', async () => {
    mockUseDocumentPane.mockReturnValue(deletedDocumentPaneValue({isDeleted: false}))

    await renderBanners()

    expect(screen.getByTestId('choose-new-document-destination-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('deleted-document-banner')).toBeNull()
  })
})

const loyalVariant: SystemVariant = {
  _id: '_.variants.loyal',
  _type: 'system.variant',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-loyal',
  conditions: {audience: 'loyal'},
  priority: 0,
  metadata: {title: 'Loyal'},
}

const scheduledDraftRelease: ReleaseDocument = {
  _id: '_.releases.rScheduled',
  _type: 'system.release',
  _rev: 'rev-scheduled',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  name: 'rScheduled',
  state: 'scheduled',
  publishAt: '2026-12-01T10:00:00Z',
  metadata: {
    title: 'Scheduled publish',
    releaseType: 'scheduled',
    intendedPublishAt: '2026-12-01T10:00:00Z',
    cardinality: 'one',
  },
}

describe('DocumentPanel scheduled draft banners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStructureTool.mockReturnValue({
      features: splitPanesFeatures,
    } as ReturnType<typeof useStructureTool>)
  })

  function renderInPerspective(perspective: Partial<PerspectiveContextValue>) {
    return renderBannersIn({...perspectiveContextValueMock, ...perspective})
  }

  async function renderBannersIn(perspective: PerspectiveContextValue) {
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    return render(
      <PerspectiveContext.Provider value={perspective}>
        {renderDocumentPanel()}
      </PerspectiveContext.Provider>,
      {wrapper},
    )
  }

  function versionPaneValue(version: {_id: string; _system: object}, variant?: SystemVariant) {
    const document = {...version, _type: 'simpleBlock', _createdAt: '2026-01-01T00:00:00Z'}
    return {
      ...documentPaneValue(),
      displayed: document,
      value: document,
      editState: {ready: true, draft: null, published: null, version: document},
      targetDocumentState: {
        status: 'ready',
        targetDocument: version,
        scopeId: version._id.split('.')[1],
        variant,
        siblings: {published: undefined, draft: undefined, version},
      },
    } as unknown as ReturnType<typeof useDocumentPane>
  }

  const scheduledDraftPerspective: Partial<PerspectiveContextValue> = {
    selectedPerspective: scheduledDraftRelease,
    selectedPerspectiveName: 'rScheduled',
    selectedReleaseId: 'rScheduled',
    perspectiveStack: ['rScheduled', 'drafts'],
    bundle: 'rScheduled',
  }

  it('shows the scheduled banner for the scheduled version of the base document', async () => {
    mockUseDocumentPane.mockReturnValue(
      versionPaneValue({
        _id: 'versions.rScheduled.doc-1',
        _system: {bundleId: 'rScheduled', group: {_ref: 'doc-1', _weak: true}},
      }),
    )

    await renderInPerspective(scheduledDraftPerspective)

    expect(screen.getByTestId('scheduled-release-banner')).toBeInTheDocument()
  })

  it('shows the scheduled banner for the scheduled version of a variant', async () => {
    mockUseDocumentPane.mockReturnValue(
      versionPaneValue(
        {
          _id: 'versions.scope-loyal.doc-1',
          _system: {
            bundleId: 'rScheduled',
            scopeId: 'scope-loyal',
            group: {_ref: 'doc-1', _weak: true},
            release: {_ref: scheduledDraftRelease._id, _weak: true},
            variants: [{_ref: loyalVariant._id, _key: 'loyal'}],
          },
        },
        loyalVariant,
      ),
    )

    await renderInPerspective({
      ...scheduledDraftPerspective,
      selectedVariantNames: ['loyal'],
      selectedVariants: [loyalVariant],
    })

    expect(screen.getByTestId('scheduled-release-banner')).toBeInTheDocument()
  })
})
