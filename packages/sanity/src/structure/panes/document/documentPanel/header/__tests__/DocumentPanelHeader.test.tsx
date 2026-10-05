import {queryHelpers, render, screen} from '@testing-library/react'
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
  CopyDocumentActions: () => null,
}))

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

async function mountHeader() {
  render(<DocumentPanelHeader menuItems={[]} />, {wrapper})
  // The locale provider suspends on first render, so wait for the toolbar to come through.
  await screen.findByTestId('document-perspective-list')
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

  it('leaves the attribute off the collapsed pane header', async () => {
    mockUsePane.mockReturnValue({collapsed: true, isLast: false} as ReturnType<typeof usePane>)

    render(<DocumentPanelHeader menuItems={[]} />, {wrapper})

    expect(await screen.findByTestId('document-header-title')).toBeInTheDocument()
    expect(queryToolbars()).toHaveLength(0)
  })
})
