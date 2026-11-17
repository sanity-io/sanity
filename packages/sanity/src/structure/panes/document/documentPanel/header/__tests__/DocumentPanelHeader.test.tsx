import {queryHelpers, render, screen} from '@testing-library/react'
import {type useWorkspace, type WorkspaceOptions} from 'sanity'
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

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<{useWorkspace: typeof useWorkspace}>()
  return {
    ...actual,
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
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
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

  it('renders the manage versions button before the copy actions', async () => {
    const inventoryWrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {beta: {documentGroupInventory: {enabled: true}}},
    })

    render(<DocumentPanelHeader menuItems={[]} />, {wrapper: inventoryWrapper})

    const button = await screen.findByTestId('document-group-inventory-button')
    const copyActions = screen.getByTestId('copy-document-actions')

    expect(button.compareDocumentPosition(copyActions)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
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
})
