import {render, screen} from '@testing-library/react'
import {type ComponentType} from 'react'
import {EMPTY} from 'rxjs'
import {type ResolvedAction, usePaneRouter} from 'sanity'
import {DocumentActionsStateContext} from 'sanity/_singletons'
import {beforeAll, beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useDocumentPerspectiveList} from '../../../hooks/useDocumentPerspectiveList'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentPaneContextValue} from '../DocumentPaneContext'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions} from './DocumentStatusBarActions'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  DocumentGroupInventoryAction: () => (
    <button type="button" data-testid="action-document-group-inventory">
      Manage versions
    </button>
  ),
  DocumentGroupInventory: () => null,
  usePausedScheduledDraft: vi.fn(() => ({isPaused: false, currentRelease: undefined})),
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

vi.mock('../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../hooks/useDocumentPerspectiveList', () => ({
  useDocumentPerspectiveList: vi.fn(() => ({})),
}))

vi.mock('../../../components/confirmDeleteDialog/useReferringDocuments', () => ({
  referringDocuments: vi.fn(() => EMPTY),
}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
const mockUsePaneRouter = usePaneRouter as MockedFunction<typeof usePaneRouter>
const mockUseDocumentPerspectiveList = useDocumentPerspectiveList as MockedFunction<
  typeof useDocumentPerspectiveList
>

const PUBLISH_ACTION: ResolvedAction = {
  label: 'Publish',
  onHandle: vi.fn(),
  action: 'publish',
}

function buildDocumentPaneValue(
  overrides: Partial<DocumentPaneContextValue> = {},
): DocumentPaneContextValue {
  return {
    displayed: {_id: 'doc-123', _type: 'author'},
    documentId: 'doc-123',
    documentType: 'author',
    connectionState: 'connected',
    isDocumentGroupInventoryActive: false,
    setIsDocumentGroupInventoryActive: vi.fn(),
    editState: {
      id: 'doc-123',
      type: 'author',
      transactionSyncLock: {enabled: false},
      liveEdit: false,
      ready: true,
      draft: {_id: 'drafts.doc-123', _type: 'author'},
      published: {_id: 'doc-123', _type: 'author'},
      version: undefined,
    },
    ...overrides,
  } as DocumentPaneContextValue
}

let TestProvider: ComponentType<{children: React.ReactNode}>

function renderActions(states: ResolvedAction[]) {
  return render(
    <DocumentActionsStateContext.Provider value={states}>
      <DocumentStatusBarActions />
    </DocumentActionsStateContext.Provider>,
    {wrapper: TestProvider},
  )
}

beforeAll(async () => {
  TestProvider = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: {
      beta: {
        documentGroupInventory: {enabled: true},
      },
    },
  })
})

describe('DocumentStatusBarActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentPane.mockReturnValue(buildDocumentPaneValue())
    mockUsePaneRouter.mockReturnValue({params: {}, setParams: vi.fn()} as never)
    mockUseDocumentPerspectiveList.mockReturnValue({} as never)
  })

  it('renders Manage versions when the document has no actions', () => {
    renderActions([])

    expect(screen.getByTestId('action-document-group-inventory')).toBeInTheDocument()
    expect(screen.queryByTestId('action-publish')).not.toBeInTheDocument()
    expect(screen.queryByTestId('action-menu-button')).not.toBeInTheDocument()
  })

  it('renders the primary action when actions are present', () => {
    renderActions([PUBLISH_ACTION])

    expect(screen.getByTestId('action-document-group-inventory')).toBeInTheDocument()
    expect(screen.getByTestId('action-publish')).toBeInTheDocument()
    expect(screen.queryByTestId('action-menu-button')).not.toBeInTheDocument()
  })
})
