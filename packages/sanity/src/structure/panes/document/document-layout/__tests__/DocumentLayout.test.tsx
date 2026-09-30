import {fireEvent, render, screen} from '@testing-library/react'
import {type ComponentProps, type ReactNode, useContext} from 'react'
import {type ContributedMenuTool, type SingleWorkspace} from 'sanity'
import {ReviewChangesContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {useStructureTool} from '../../../../useStructureTool'
import {HISTORY_INSPECTOR_NAME} from '../../constants'
import {useDocumentActionsPlacement} from '../../statusBar/documentActionsPlacement'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTools} from '../../useDocumentTools'
import {DocumentLayout} from '../DocumentLayout'

vi.mock('../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

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
  useStructureTool: vi.fn(() => ({features: {reviewChanges: true, resizablePanes: true}})),
}))

// A placeholder rather than `() => null`: the menu tools the header would put in the overflow
// menu are only observable here through what the resolution hands it.
vi.mock('../../documentPanel/header/DocumentPanelHeader', () => ({
  DocumentPanelHeader: () => <MenuToolsProbe />,
}))

vi.mock('../../../../DocumentActionsProvider', () => ({
  DocumentActionsProvider: ({children}: {children: ReactNode}) => children,
}))

vi.mock('../../DocumentOperationResults', () => ({
  DocumentOperationResults: () => <div data-testid="mock-document-operation-results" />,
}))

vi.mock('../../documentPanel/DocumentPanel', () => ({
  DocumentPanel: (panelProps: {toolbar: ReactNode; toolbarPlacement: string}) => (
    <div data-testid="mock-document-panel" data-toolbar-placement={panelProps.toolbarPlacement}>
      <ReviewChangesProbe />
      {panelProps.toolbar}
    </div>
  ),
}))

vi.mock('../DocumentToolbar', () => ({
  DocumentToolbar: (toolbarProps: {placement: string}) => (
    <div data-testid="mock-document-toolbar" data-placement={toolbarProps.placement} />
  ),
}))

vi.mock('../../keyboardShortcuts/DocumentActionShortcuts', () => ({
  DocumentActionShortcuts: ({
    children,
    onKeyUp,
  }: {
    children: ReactNode
    onKeyUp: ComponentProps<'div'>['onKeyUp']
  }) => (
    <div data-testid="mock-pane-root" onKeyUp={onKeyUp}>
      <ShortcutsPlacementProbe />
      {children}
    </div>
  ),
}))

function MenuToolsProbe() {
  const {menu} = useDocumentTools()

  return (
    <div data-testid="mock-document-panel-header">
      {menu.map((tool) => (
        <div key={tool.id} data-testid={`menu-tool-${tool.id}`} />
      ))}
    </div>
  )
}

function ShortcutsPlacementProbe() {
  return <div data-testid="shortcuts-placement">{useDocumentActionsPlacement()}</div>
}

function ReviewChangesProbe() {
  const {isReviewChangesEnabled, isInteractive} = useContext(ReviewChangesContext)

  return (
    <div
      data-testid="review-changes-probe"
      data-review-changes-enabled={isReviewChangesEnabled}
      data-interactive={isInteractive}
    />
  )
}

const mockUseDocumentPane = vi.mocked(useDocumentPane)
const mockUseStructureTool = vi.mocked(useStructureTool)

const DEFAULT_STRUCTURE_TOOL_FEATURES = {
  features: {reviewChanges: true, resizablePanes: true},
} as unknown as ReturnType<typeof useStructureTool>

function withHistoryInspector() {
  return {
    ...documentPaneValue(),
    inspectors: [{name: HISTORY_INSPECTOR_NAME}],
  } as unknown as ReturnType<typeof useDocumentPane>
}

function documentPaneValue() {
  return {
    changesOpen: false,
    displayed: {_id: 'doc-1', _type: 'author'},
    documentId: 'doc-1',
    documentType: 'author',
    editState: {ready: true, draft: null, published: null, version: undefined},
    fieldActions: [],
    focusPath: [],
    inspectOpen: false,
    inspector: null,
    inspectors: [],
    onFocus: vi.fn(),
    onHistoryOpen: vi.fn(),
    onMenuAction: vi.fn(),
    onPathOpen: vi.fn(),
    paneKey: 'pane-1',
    schemaType: {name: 'author', jsonType: 'object', fields: []},
    value: {_id: 'doc-1', _type: 'author'},
    isInitialValueLoading: false,
    ready: true,
    previewUrl: undefined,
  } as unknown as ReturnType<typeof useDocumentPane>
}

const bookmark = vi.fn()

function bookmarkTool(shortcut = 'Ctrl+Alt+L'): ContributedMenuTool {
  return {
    id: 'closePane',
    placement: 'menu',
    title: 'Bookmark',
    shortcut,
    onAction: bookmark,
  }
}

async function renderDocumentLayout(
  placement?: 'top' | 'bottom',
  config?: Partial<SingleWorkspace>,
) {
  const TestProvider = await createTestProvider({
    config,
    resources: [structureUsEnglishLocaleBundle],
  })

  return render(
    <TestProvider>
      <DocumentLayout actionsPlacement={placement} documentId="doc-1" documentType="author" />
    </TestProvider>,
  )
}

describe('DocumentLayout', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(documentPaneValue())
  })

  it('defaults the actions bar to the bottom', async () => {
    await renderDocumentLayout()

    expect(await screen.findByTestId('mock-document-toolbar')).toHaveAttribute(
      'data-placement',
      'bottom',
    )
    expect(await screen.findByTestId('mock-document-panel')).toHaveAttribute(
      'data-toolbar-placement',
      'bottom',
    )
    expect(await screen.findByTestId('shortcuts-placement')).toHaveTextContent('bottom')
  })

  it('places the actions bar at the top when asked to', async () => {
    await renderDocumentLayout('top')

    expect(await screen.findByTestId('mock-document-toolbar')).toHaveAttribute(
      'data-placement',
      'top',
    )
    expect(await screen.findByTestId('mock-document-panel')).toHaveAttribute(
      'data-toolbar-placement',
      'top',
    )
  })

  it('scopes the placement provider above the keyboard shortcut dialogs', async () => {
    await renderDocumentLayout('top')

    expect(await screen.findByTestId('shortcuts-placement')).toHaveTextContent('top')
  })
})

describe('DocumentLayout review changes', () => {
  beforeEach(() => {
    mockUseStructureTool.mockReturnValue(DEFAULT_STRUCTURE_TOOL_FEATURES)
  })

  it('disables the change bar when no history inspector is configured', async () => {
    mockUseDocumentPane.mockReturnValue(documentPaneValue())

    await renderDocumentLayout()

    expect(await screen.findByTestId('review-changes-probe')).toHaveAttribute(
      'data-review-changes-enabled',
      'false',
    )
  })

  it('enables the change bar and the open-review-changes button with a history inspector', async () => {
    mockUseDocumentPane.mockReturnValue(withHistoryInspector())

    await renderDocumentLayout()

    const probe = await screen.findByTestId('review-changes-probe')
    expect(probe).toHaveAttribute('data-review-changes-enabled', 'true')
    expect(probe).toHaveAttribute('data-interactive', 'true')
  })

  it('keeps the change bar enabled when document.tools removes every tool from the toolbar', async () => {
    mockUseDocumentPane.mockReturnValue(withHistoryInspector())

    await renderDocumentLayout(undefined, {document: {tools: () => []}})

    const probe = await screen.findByTestId('review-changes-probe')
    expect(probe).toHaveAttribute('data-review-changes-enabled', 'true')
    expect(probe).toHaveAttribute('data-interactive', 'true')
  })

  it('keeps the change bar but makes it non-interactive on a narrow viewport', async () => {
    mockUseDocumentPane.mockReturnValue(withHistoryInspector())
    mockUseStructureTool.mockReturnValue({
      features: {reviewChanges: false, resizablePanes: true},
    } as unknown as ReturnType<typeof useStructureTool>)

    await renderDocumentLayout()

    const probe = await screen.findByTestId('review-changes-probe')
    expect(probe).toHaveAttribute('data-review-changes-enabled', 'true')
    expect(probe).toHaveAttribute('data-interactive', 'false')
  })
})

describe('DocumentLayout contributed menu tools', () => {
  it('hands a menu tool configured through document.tools to the overflow menu', async () => {
    await renderDocumentLayout(undefined, {
      document: {tools: (prev) => [...prev, bookmarkTool()]},
    })

    expect(await screen.findByTestId('menu-tool-closePane')).toBeInTheDocument()
  })

  it('hands none to the overflow menu when the config contributes none', async () => {
    await renderDocumentLayout()

    expect(await screen.findByTestId('mock-document-panel-header')).toBeInTheDocument()
    expect(screen.queryByTestId('menu-tool-closePane')).toBeNull()
  })
})

describe('DocumentLayout keyboard shortcuts', () => {
  const INSPECT_SHORTCUT = {key: 'i', code: 'KeyI', keyCode: 73}
  const BOOKMARK_SHORTCUT = {key: 'l', code: 'KeyL', keyCode: 76}

  function pressShortcut(shortcut: typeof INSPECT_SHORTCUT) {
    // oxlint-disable-next-line testing-library/prefer-user-event -- the subject is a container's raw onKeyUp, which userEvent dispatches past
    fireEvent.keyUp(screen.getByTestId('mock-pane-root'), {
      ...shortcut,
      ctrlKey: true,
      altKey: true,
    })
  }

  it('fires the inspect action on its shortcut by default', async () => {
    const pane = documentPaneValue()
    mockUseDocumentPane.mockReturnValue(pane)

    await renderDocumentLayout()
    pressShortcut(INSPECT_SHORTCUT)

    expect(pane.onMenuAction).toHaveBeenCalledWith(expect.objectContaining({action: 'inspect'}))
  })

  it('withdraws the inspect shortcut when the tool is filtered out entirely', async () => {
    const pane = documentPaneValue()
    mockUseDocumentPane.mockReturnValue(pane)

    await renderDocumentLayout(undefined, {
      document: {tools: (prev) => prev.filter((tool) => tool.id !== 'inspect')},
    })
    pressShortcut(INSPECT_SHORTCUT)

    expect(pane.onMenuAction).not.toHaveBeenCalled()
  })

  it("fires a menu tool's onAction on its shortcut", async () => {
    mockUseDocumentPane.mockReturnValue(documentPaneValue())

    await renderDocumentLayout(undefined, {
      document: {tools: (prev) => [...prev, bookmarkTool()]},
    })
    pressShortcut(BOOKMARK_SHORTCUT)

    expect(bookmark).toHaveBeenCalledTimes(1)
  })

  it('leaves the built-in winning when a menu tool declares the same shortcut', async () => {
    const pane = documentPaneValue()
    mockUseDocumentPane.mockReturnValue(pane)

    await renderDocumentLayout(undefined, {
      document: {tools: (prev) => [...prev, bookmarkTool('Ctrl+Alt+I')]},
    })
    pressShortcut(INSPECT_SHORTCUT)

    expect(pane.onMenuAction).toHaveBeenCalledWith(expect.objectContaining({action: 'inspect'}))
    expect(bookmark).not.toHaveBeenCalled()
  })
})
