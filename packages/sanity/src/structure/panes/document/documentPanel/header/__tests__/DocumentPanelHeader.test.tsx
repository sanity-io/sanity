import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {type DocumentHeaderTool, type DocumentMenuTool, type SingleWorkspace} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getAllByDataUi} from '../../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../../../components/paneRouter/usePaneRouter'
import {useHistoryRestoreAction} from '../../../../../documentActions/HistoryRestoreAction'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type PaneMenuItem} from '../../../../../types'
import {useStructureTool} from '../../../../../useStructureTool'
import {buildResolvedTools, EMPTY_TOOLS} from '../../../__tests__/toolsFixture'
import {useDocumentPane} from '../../../useDocumentPane'
import {useDocumentTools} from '../../../useDocumentTools'
import {DocumentPanelHeader} from '../DocumentPanelHeader'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  FieldPresenceInner: () => <div data-testid="mock-field-presence" />,
  useDocumentPresence: vi.fn(() => []),
  useFieldActions: vi.fn(() => ({actions: []})),
  useTranslation: vi.fn(() => ({t: (key: string) => key})),
}))

vi.mock('../../../../../components/pane/usePane', () => ({
  usePane: vi.fn(() => ({collapsed: false, isLast: false})),
}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

vi.mock('../../../../../useStructureTool', () => ({
  useStructureTool: vi.fn(),
}))

vi.mock('../../../useDocumentTools', () => ({
  useDocumentTools: vi.fn(),
}))

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../statusBar/ActionMenuButton', () => ({
  ActionDialogWrapper: ({
    children,
  }: {
    children: (props: {handleAction: (index: number) => void}) => ReactNode
  }) => children({handleAction: () => {}}),
  ActionMenuListItem: () => <div data-testid="mock-action-menu-list-item" />,
}))

const actionStates = vi.hoisted(() => ({current: [] as unknown[]}))

vi.mock('../../../../../components/RenderActionCollectionState', () => ({
  RenderActionCollectionState: ({
    children,
  }: {
    children: (props: {states: unknown[]}) => ReactNode
  }) => children({states: actionStates.current}),
}))

vi.mock('../CopyDocumentActions', () => ({
  CopyDocumentActions: () => <button data-testid="copy-document-actions-button" type="button" />,
}))

vi.mock('../perspective/DocumentPerspectiveList', () => ({
  DocumentPerspectiveList: () => <div data-testid="mock-document-perspective-list" />,
}))

vi.mock('../DocumentTargetBadges', () => ({
  DocumentTargetBadges: () => <div data-testid="mock-document-target-badges" />,
}))

vi.mock('../documentGroupInventoryHint/DocumentGroupInventoryHint', () => ({
  DocumentGroupInventoryHint: () => <div data-testid="mock-document-group-inventory-hint" />,
}))

const mockUseDocumentTools = vi.mocked(useDocumentTools)
const mockUseDocumentPane = vi.mocked(useDocumentPane)
const mockUsePaneRouter = vi.mocked(usePaneRouter)
const mockUseStructureTool = vi.mocked(useStructureTool)

function setStructureTool(features: Record<string, boolean> = {}) {
  mockUseStructureTool.mockReturnValue({
    features: {backButton: false, splitViews: true, ...features},
  } as ReturnType<typeof useStructureTool>)
}

function Pin() {
  return <button data-testid="tool-pin" type="button" />
}

function Flag() {
  return <button data-testid="tool-flag" type="button" />
}

const PIN: DocumentHeaderTool = {id: 'splitPane', placement: 'header', render: Pin}
const FLAG: DocumentHeaderTool = {id: 'focusMode', placement: 'header', render: Flag}

const bookmark = vi.fn()

const BOOKMARK: DocumentMenuTool = {
  id: 'closePane',
  placement: 'menu',
  title: 'Bookmark',
  onAction: bookmark,
}

/**
 * Closed `@sanity/ui` menus stay mounted and hidden with `display: none`. Runtime styles are
 * disabled in jsdom, so the open menu does not read as visible either, which is why it is picked
 * by the absence of that hidden style.
 */
function getOpenContextMenu() {
  const [openMenu] = getAllByDataUi(document.body, 'MenuButton__popover').filter(
    (popover) => popover.style.display !== 'none',
  )

  return openMenu
}

/** Keeps the bordered bar alive so a case can isolate the gate it is about. */
const COPY_ACTIONS_ONLY = {without: ['versionPicker', 'titleBar'] as const}

function setTools(tools: ReturnType<typeof buildResolvedTools>) {
  mockUseDocumentTools.mockReturnValue(tools)
}

async function setPresence(sessionCount: number) {
  const sessions = Array.from({length: sessionCount}, (unused, index) => ({
    path: [],
    sessionId: `session-${index}`,
    user: {id: `user-${index}`},
    lastActiveAt: '2020-01-01T00:00:00Z',
  }))

  const {useDocumentPresence} = await import('sanity')
  vi.mocked(useDocumentPresence).mockReturnValue(
    sessions as unknown as ReturnType<typeof useDocumentPresence>,
  )
}

function setPaneActions(states: unknown[]) {
  actionStates.current = states
}

function setPaneRouter(overrides: Partial<ReturnType<typeof usePaneRouter>> = {}) {
  mockUsePaneRouter.mockReturnValue({
    index: 0,
    hasGroupSiblings: false,
    ...overrides,
  } as ReturnType<typeof usePaneRouter>)
}

function setDocumentPane(overrides: Partial<ReturnType<typeof useDocumentPane>> = {}) {
  mockUseDocumentPane.mockReturnValue({
    connectionState: 'connected',
    documentId: 'doc-1',
    documentType: 'simpleBlock',
    editState: {ready: true, draft: null, published: null, version: undefined},
    menuItemGroups: [],
    onMenuAction: vi.fn(),
    schemaType: {name: 'simpleBlock'},
    unstable_languageFilter: [],
    ...overrides,
  } as unknown as ReturnType<typeof useDocumentPane>)
}

async function renderHeader(
  options: {config?: Partial<SingleWorkspace>; menuItems?: PaneMenuItem[]} = {},
) {
  const wrapper = await createTestProvider({
    config: options.config,
    resources: [structureUsEnglishLocaleBundle],
  })
  return render(<DocumentPanelHeader menuItems={options.menuItems ?? []} />, {wrapper})
}

const DOCUMENT_GROUP_INVENTORY: Partial<SingleWorkspace> = {
  beta: {documentGroupInventory: {enabled: true}},
}

const OVERFLOW_MENU_ITEM: PaneMenuItem = {action: 'inspect', title: 'Inspect'}
const HEADER_BUTTON_MENU_ITEM: PaneMenuItem = {
  action: 'validate',
  title: 'Validation',
  showAsAction: true,
}

function queryHeaderCard(container: HTMLElement) {
  return container.querySelector('[data-ui="Card"]')
}

describe('DocumentPanelHeader', () => {
  beforeEach(async () => {
    setTools(EMPTY_TOOLS)
    setPaneActions([])
    setPaneRouter()
    setStructureTool()
    setDocumentPane()
    await setPresence(0)
  })

  describe('the bordered bar', () => {
    it('renders nothing when the resolution is empty and nothing else fills the header', async () => {
      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).toBeNull()
      expect(screen.queryByTestId('pane-context-menu-button')).toBeNull()
      expect(screen.queryByTestId('copy-document-actions-button')).toBeNull()
      expect(screen.queryByTestId('mock-document-perspective-list')).toBeNull()
      expect(screen.queryByTestId('document-level-presence')).toBeNull()
    })

    it('renders nothing when the only menu nodes are empty groups', async () => {
      setDocumentPane({menuItemGroups: [{id: 'inspectors'}, {id: 'paneActions'}]})

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).toBeNull()
    })

    it('renders the bar when a contributed tool is the only thing in it', async () => {
      setTools(buildResolvedTools({without: ['versionPicker', 'copyActions'], header: [PIN]}))

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('tool-pin')).toBeInTheDocument()
    })

    it('renders the bar when a menu tool is the only thing in it', async () => {
      setTools(
        buildResolvedTools({
          without: ['versionPicker', 'copyActions', 'titleBar'],
          menu: [BOOKMARK],
        }),
      )

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('renders the bar when the version picker is the only thing in it', async () => {
      setTools(buildResolvedTools({without: ['copyActions']}))

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
    })

    it('renders the bar when the copy actions are the only thing in it', async () => {
      setTools(buildResolvedTools(COPY_ACTIONS_ONLY))

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('copy-document-actions-button')).toBeInTheDocument()
    })

    it('renders the bar when a language filter is the only thing in it', async () => {
      setDocumentPane({
        unstable_languageFilter: [() => <div data-testid="mock-language-filter" />],
      })

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('mock-language-filter')).toBeInTheDocument()
    })

    // `menuItems.ts` deliberately keeps `showAsAction` items when every overflow tool is gone,
    // so the bar has to survive for them.
    it('renders the bar when a showAsAction button is the only thing in it', async () => {
      const {container} = await renderHeader({menuItems: [HEADER_BUTTON_MENU_ITEM]})

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByRole('button', {name: 'Validation'})).toBeInTheDocument()
    })

    it('renders the bar when the overflow menu is the only thing in it', async () => {
      const {container} = await renderHeader({menuItems: [OVERFLOW_MENU_ITEM]})

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('renders the bar when presence is the only thing in it', async () => {
      await setPresence(2)

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('document-level-presence')).toBeInTheDocument()
    })

    it('renders nothing when presence is the only candidate and nobody is in the document', async () => {
      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).toBeNull()
    })

    it('renders the bar and the overflow button when a pane action is the only header content', async () => {
      setPaneActions([{label: 'Publish', onHandle: () => {}}])

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).not.toBeNull()
      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('renders nothing when there is no header content and no pane actions', async () => {
      setPaneActions([])

      const {container} = await renderHeader()

      expect(queryHeaderCard(container)).toBeNull()
      expect(screen.queryByTestId('pane-context-menu-button')).toBeNull()
    })
  })

  describe('the overflow button', () => {
    beforeEach(() => {
      setTools(buildResolvedTools(COPY_ACTIONS_ONLY))
    })

    it('is absent when there are no overflow nodes and no pane actions', async () => {
      await renderHeader()

      expect(screen.getByTestId('copy-document-actions-button')).toBeInTheDocument()
      expect(screen.queryByTestId('pane-context-menu-button')).toBeNull()
    })

    it('renders when one overflow node is present', async () => {
      await renderHeader({menuItems: [OVERFLOW_MENU_ITEM]})

      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('renders when one pane action is present and nothing else would fill the menu', async () => {
      setPaneActions([{label: 'Publish', onHandle: () => {}}])

      await renderHeader()

      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('stays absent when the only pane action is the one the header always drops', async () => {
      setPaneActions([
        {label: 'Restore', action: useHistoryRestoreAction.action, onHandle: () => {}},
      ])

      await renderHeader()

      expect(screen.queryByTestId('pane-context-menu-button')).toBeNull()
    })

    it('renders when a menu tool is its only content', async () => {
      setTools(buildResolvedTools({...COPY_ACTIONS_ONLY, menu: [BOOKMARK]}))

      await renderHeader()

      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('is absent when the only menu nodes are empty groups', async () => {
      setDocumentPane({menuItemGroups: [{id: 'inspectors'}, {id: 'paneActions'}]})

      await renderHeader()

      expect(screen.queryByTestId('pane-context-menu-button')).toBeNull()
    })

    it('renders when a group holds an item', async () => {
      setDocumentPane({menuItemGroups: [{id: 'inspectors'}]})

      await renderHeader({menuItems: [{...OVERFLOW_MENU_ITEM, group: 'inspectors'}]})

      expect(screen.getByTestId('pane-context-menu-button')).toBeInTheDocument()
    })

    it('is absent when a showAsAction item is the only menu item, because it is its own button', async () => {
      await renderHeader({menuItems: [HEADER_BUTTON_MENU_ITEM]})

      expect(screen.getByRole('button', {name: 'Validation'})).toBeInTheDocument()
      expect(screen.queryByTestId('pane-context-menu-button')).toBeNull()
    })
  })

  describe('the version picker', () => {
    it('renders the perspective list when versionPicker is in the resolution', async () => {
      setTools(buildResolvedTools())

      await renderHeader()

      expect(screen.getByTestId('document-perspective-list')).toBeInTheDocument()
      expect(screen.queryByTestId('document-target-badges')).toBeNull()
    })

    it('omits the perspective list when versionPicker is not in the resolution', async () => {
      setTools(buildResolvedTools({without: ['versionPicker']}))

      await renderHeader()

      expect(screen.queryByTestId('document-perspective-list')).toBeNull()
      expect(screen.queryByTestId('mock-document-perspective-list')).toBeNull()
    })

    it('renders the target badges when versionPicker is in the resolution', async () => {
      setTools(buildResolvedTools())

      await renderHeader({config: DOCUMENT_GROUP_INVENTORY})

      expect(screen.getByTestId('document-target-badges')).toBeInTheDocument()
      expect(screen.queryByTestId('document-perspective-list')).toBeNull()
    })

    it('omits the target badges when versionPicker is not in the resolution', async () => {
      setTools(buildResolvedTools({without: ['versionPicker']}))

      await renderHeader({config: DOCUMENT_GROUP_INVENTORY})

      expect(screen.queryByTestId('document-target-badges')).toBeNull()
      expect(screen.queryByTestId('mock-document-target-badges')).toBeNull()
    })
  })

  describe('the copy actions', () => {
    it('renders one copy button when copyActions is in the resolution', async () => {
      setTools(buildResolvedTools())

      await renderHeader()

      const buttons = screen.getAllByTestId('copy-document-actions-button')
      expect(buttons).toHaveLength(1)
      expect(buttons[0]).toBeEnabled()
    })

    it('omits the copy button when copyActions is not in the resolution', async () => {
      setTools(buildResolvedTools({without: ['copyActions']}))

      await renderHeader()

      expect(screen.queryByTestId('copy-document-actions-button')).toBeNull()
    })
  })

  describe('presence', () => {
    it('renders the avatars whenever somebody else is in the document', async () => {
      setTools(buildResolvedTools())
      await setPresence(2)

      await renderHeader()

      expect(screen.getByTestId('document-level-presence')).toBeInTheDocument()
      expect(screen.getByTestId('mock-field-presence')).toBeInTheDocument()
    })

    it('omits the avatars when nobody is in the document', async () => {
      setTools(buildResolvedTools())

      await renderHeader()

      expect(screen.queryByTestId('document-level-presence')).toBeNull()
    })
  })

  describe('contributed menu tools', () => {
    it('renders one as a menu item that fires its onAction on click', async () => {
      setTools(buildResolvedTools({...COPY_ACTIONS_ONLY, menu: [BOOKMARK]}))

      await renderHeader()
      await userEvent.click(screen.getByTestId('pane-context-menu-button'))

      const item = within(getOpenContextMenu()).getByTestId('action-bookmark')
      await userEvent.click(item)

      expect(bookmark).toHaveBeenCalledTimes(1)
    })

    it('renders them after the built-in items', async () => {
      setTools(buildResolvedTools({...COPY_ACTIONS_ONLY, menu: [BOOKMARK]}))

      await renderHeader({menuItems: [OVERFLOW_MENU_ITEM]})
      await userEvent.click(screen.getByTestId('pane-context-menu-button'))

      const openMenu = within(getOpenContextMenu())
      const inspect = openMenu.getByTestId('action-inspect')
      const bookmarkItem = openMenu.getByTestId('action-bookmark')

      expect(inspect.compareDocumentPosition(bookmarkItem)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    it('renders none when the resolution contributes none', async () => {
      setTools(buildResolvedTools(COPY_ACTIONS_ONLY))

      await renderHeader({menuItems: [OVERFLOW_MENU_ITEM]})
      await userEvent.click(screen.getByTestId('pane-context-menu-button'))

      expect(within(getOpenContextMenu()).queryByTestId('action-bookmark')).toBeNull()
    })
  })

  describe('contributed tools', () => {
    it('renders them in the order the resolution left them', async () => {
      setTools(buildResolvedTools({header: [PIN, FLAG]}))

      await renderHeader()

      const pin = screen.getByTestId('tool-pin')
      const flag = screen.getByTestId('tool-flag')

      expect(pin.compareDocumentPosition(flag)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    it('renders an enabled tool enabled', async () => {
      setTools(buildResolvedTools({header: [PIN]}))

      await renderHeader()

      expect(screen.getByTestId('tool-pin')).toBeEnabled()
    })

    it('renders none when the resolution contributes none', async () => {
      setTools(buildResolvedTools())

      await renderHeader()

      expect(screen.queryByTestId('tool-pin')).toBeNull()
      expect(screen.queryByTestId('tool-flag')).toBeNull()
    })
  })

  it('leaves a default resolution with everything in it', async () => {
    setTools(buildResolvedTools({header: [PIN]}))
    await setPresence(2)

    await renderHeader({menuItems: [OVERFLOW_MENU_ITEM]})

    expect(screen.getByTestId('document-level-presence')).toBeInTheDocument()
    expect(screen.getByTestId('document-perspective-list')).toBeInTheDocument()
    expect(screen.getByTestId('copy-document-actions-button')).toBeEnabled()
    expect(screen.getByTestId('pane-context-menu-button')).toBeEnabled()
    expect(screen.getByTestId('tool-pin')).toBeEnabled()
  })
})
