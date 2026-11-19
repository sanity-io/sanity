import {queryHelpers, render, screen} from '@testing-library/react'
import {type DocumentPresence, type useWorkspace, type WorkspaceOptions} from 'sanity'
import {afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePane} from '../../../../../components/pane/usePane'
import {usePaneRouter} from '../../../../../components/paneRouter/usePaneRouter'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useStructureTool} from '../../../../../useStructureTool'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentPanelHeader} from '../DocumentPanelHeader'

vi.mock('../../../useDocumentPane')
vi.mock('../../../../../components/pane/usePane')
vi.mock('../../../../../components/paneRouter/usePaneRouter')
vi.mock('../../../../../useStructureTool')

vi.mock('../DocumentHeaderTitle', () => ({
  DocumentHeaderTitle: () => <span data-testid="document-header-title">Title</span>,
}))

vi.mock('../perspective/DocumentPerspectiveList', () => ({
  DocumentPerspectiveList: () => <span>Draft</span>,
}))

vi.mock('../CopyDocumentActions', () => ({
  CopyDocumentActions: () => <span data-testid="copy-document-actions" />,
}))

vi.mock('../DocumentGroupInventoryButton', () => ({
  DocumentGroupInventoryButton: () => <span data-testid="document-group-inventory-button" />,
}))

vi.mock('../DocumentPanelNavigation/DocumentPanelNavigation', () => ({
  DocumentPanelNavigation: () => <span>Published</span>,
}))

/**
 * Variants switch the inventory on when the config resolves, so a test that needs variants
 * without the inventory overrides the resolved `beta` instead.
 */
const workspaceBeta = vi.hoisted(() => ({override: undefined as WorkspaceOptions['beta']}))

/** Presence for the document across all of its versions, as the presence store reports it. */
const documentPresence = vi.hoisted(() => ({current: [] as DocumentPresence[]}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<{useWorkspace: typeof useWorkspace}>()
  return {
    ...actual,
    useDocumentPresence: () => documentPresence.current,
    // The avatar stack needs the user colour context; the tests only need who it was handed.
    FieldPresenceInner: ({presence}: {presence: DocumentPresence[]}) => (
      <span data-testid="presence-users">{presence.map((item) => item.user.id).join(',')}</span>
    ),
    useWorkspace: () => {
      const workspace = actual.useWorkspace()
      return workspaceBeta.override ? {...workspace, beta: workspaceBeta.override} : workspace
    },
  }
})

// Typed as a partial so every field below is checked against the real context, without
// having to build the ~40 fields the header never reads.
const mockUseDocumentPane = useDocumentPane as Mock<() => Partial<DocumentPaneContextValue>>
const mockUsePane = usePane as Mock<typeof usePane>
const mockUsePaneRouter = usePaneRouter as Mock<typeof usePaneRouter>
const mockUseStructureTool = useStructureTool as Mock<typeof useStructureTool>

let wrapper: React.ComponentType<{children: React.ReactNode}>

function documentPaneValue(): Partial<DocumentPaneContextValue> {
  return {
    documentId: 'doc-1',
    value: {_id: 'drafts.doc-1', _type: 'article'},
    connectionState: 'connected',
    editState: null,
    menuItemGroups: [],
    views: [],
    unstable_languageFilter: [],
    onMenuAction: vi.fn(),
    onPaneClose: vi.fn(),
    onSetMaximizedPane: vi.fn(),
  }
}

function queryToolbars() {
  return queryHelpers.queryAllByAttribute('data-sanity-document-toolbar', document.body, '')
}

async function mountHeader(
  options: {
    container?: 'document-perspective-list' | 'document-panel-navigation'
    wrapper?: React.ComponentType<{children: React.ReactNode}>
  } = {},
) {
  const {container = 'document-perspective-list'} = options
  render(<DocumentPanelHeader menuItems={[]} />, {wrapper: options.wrapper ?? wrapper})
  // The locale provider suspends on first render, so wait for the toolbar to come through.
  await screen.findByTestId(container)
}

beforeAll(async () => {
  // The inventory is on by default, so the tests of the perspective list switch it off.
  wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: {beta: {documentGroupInventory: {enabled: false}}},
  })
})

describe('DocumentPanelHeader', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(documentPaneValue())
    mockUsePane.mockReturnValue({collapsed: false, isLast: true} as ReturnType<typeof usePane>)
    mockUsePaneRouter.mockReturnValue({index: 0, hasGroupSiblings: false} as ReturnType<
      typeof usePaneRouter
    >)
    mockUseStructureTool.mockReturnValue({
      features: {splitViews: false, backButton: false},
    } as ReturnType<typeof useStructureTool>)
  })

  afterEach(() => {
    workspaceBeta.override = undefined
    documentPresence.current = []
    vi.clearAllMocks()
  })

  it('marks the toolbar with the attribute a host selects on to hide it', async () => {
    await mountHeader()

    expect(queryToolbars()).toHaveLength(1)
  })

  it('puts the attribute on an ancestor of the controls at both ends of the toolbar', async () => {
    await mountHeader()

    const [toolbar] = queryToolbars()

    expect(toolbar).toContainElement(screen.getByTestId('document-perspective-list'))
    expect(toolbar).toContainElement(screen.getByTestId('focus-pane-button-focus'))
  })

  it('leaves out the manage versions button when the document group inventory is disabled', async () => {
    await mountHeader()

    expect(screen.queryByTestId('document-group-inventory-button')).toBeNull()
  })

  it('leaves the manage versions button to the bottom bar', async () => {
    const inventoryWrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {beta: {documentGroupInventory: {enabled: true}}},
    })

    render(<DocumentPanelHeader menuItems={[]} />, {wrapper: inventoryWrapper})

    await screen.findByTestId('copy-document-actions')
    expect(screen.queryByTestId('action-document-group-inventory')).toBeNull()
  })

  it('renders the inventory and its manage versions button by default, with variants off', async () => {
    const defaultWrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    await mountHeader({container: 'document-panel-navigation', wrapper: defaultWrapper})

    expect(screen.getByTestId('document-group-inventory-button')).toBeInTheDocument()
    expect(screen.queryByTestId('document-perspective-list')).toBeNull()
  })

  it('renders the perspective list when neither variants nor the inventory are enabled', async () => {
    await mountHeader()

    expect(screen.queryByTestId('document-panel-navigation')).toBeNull()
  })

  it('renders the document panel navigation when the document group inventory is enabled', async () => {
    const inventoryWrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {beta: {documentGroupInventory: {enabled: true}}},
    })

    await mountHeader({container: 'document-panel-navigation', wrapper: inventoryWrapper})

    expect(screen.queryByTestId('document-perspective-list')).toBeNull()
  })

  it('renders the document panel navigation for variants without the inventory', async () => {
    workspaceBeta.override = {
      variants: {enabled: true},
      documentGroupInventory: {enabled: false},
    }

    await mountHeader({container: 'document-panel-navigation'})

    expect(screen.queryByTestId('document-perspective-list')).toBeNull()
    expect(screen.queryByTestId('document-group-inventory-button')).toBeNull()
  })

  it('leaves the attribute off the collapsed pane header', async () => {
    mockUsePane.mockReturnValue({collapsed: true, isLast: false} as ReturnType<typeof usePane>)

    render(<DocumentPanelHeader menuItems={[]} />, {wrapper})

    expect(await screen.findByTestId('document-header-title')).toBeInTheDocument()
    expect(queryToolbars()).toHaveLength(0)
  })

  describe('presence', () => {
    function presenceOn(documentId: string, userId: string): DocumentPresence {
      return {
        user: {id: userId, displayName: userId},
        path: [],
        sessionId: `session-${userId}`,
        documentId,
        lastActiveAt: '2026-11-17T10:00:00.000Z',
      }
    }

    it('shows the people on the version the pane displays', async () => {
      documentPresence.current = [
        presenceOn('drafts.doc-1', 'ada'),
        presenceOn('versions.rSpring.doc-1', 'linus'),
      ]

      await mountHeader()

      expect(screen.getByTestId('presence-users').textContent).toBe('ada')
    })

    it('leaves out the people on other versions of the document', async () => {
      mockUseDocumentPane.mockReturnValue({
        ...documentPaneValue(),
        value: {_id: 'versions.rSpring.doc-1', _type: 'article'},
      })
      documentPresence.current = [
        presenceOn('drafts.doc-1', 'ada'),
        presenceOn('doc-1', 'grace'),
        presenceOn('versions.rOther.doc-1', 'linus'),
      ]

      await mountHeader()

      expect(screen.queryByTestId('document-level-presence')).toBeNull()
    })
  })
})
