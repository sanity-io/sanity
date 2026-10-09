import {render, screen} from '@testing-library/react'
import {act, type ComponentType} from 'react'
import {EMPTY} from 'rxjs'
import {DocumentActionsStateContext, TasksModePromiseContext} from 'sanity/_singletons'
import {beforeAll, beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {type ResolvedAction} from '../../../components/RenderActionCollectionState'
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
}))

vi.mock('../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

vi.mock('../../../hooks/useDocumentPerspectiveList', () => ({
  useDocumentPerspectiveList: vi.fn(() => ({})),
}))

vi.mock('../../../components/confirmDeleteDialog/useReferringDocuments', () => ({
  referringDocuments: vi.fn(() => EMPTY),
}))

// The real footer needs the tasks store and navigation providers; this test only cares about
// whether the status bar mounts it, which the lazy import and the mode promise decide.
vi.mock('../../../../core/tasks/plugin/TasksFooterOpenTasks', () => ({
  default: () => <div data-testid="tasks-footer-open-tasks" />,
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

// Mounts with the tasks mode promise `TasksStudioProvider` would provide. The footer suspends on
// that promise and on its lazy chunk, so the mount has to happen inside an awaited async `act`.
async function renderActionsWithTasksMode(
  states: ResolvedAction[],
  tasksModePromise: Promise<'default' | 'upsell' | null>,
) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see the note above
  await act(async () => {
    render(
      <TasksModePromiseContext value={tasksModePromise}>
        <DocumentActionsStateContext.Provider value={states}>
          <DocumentStatusBarActions />
        </DocumentActionsStateContext.Provider>
      </TasksModePromiseContext>,
      {wrapper: TestProvider},
    )
  })
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

  describe('tasks footer', () => {
    it('does not mount the footer when the tasks plugin is not part of the workspace', () => {
      renderActions([PUBLISH_ACTION])

      // Without a mode promise there is nothing to suspend on, so the actions render synchronously
      expect(screen.getByTestId('action-publish')).toBeInTheDocument()
      expect(screen.queryByTestId('tasks-footer-open-tasks')).not.toBeInTheDocument()
    })

    it('mounts the footer once the tasks mode has settled', async () => {
      await renderActionsWithTasksMode([PUBLISH_ACTION], Promise.resolve('default'))

      expect(await screen.findByTestId('tasks-footer-open-tasks')).toBeInTheDocument()
      expect(screen.getByTestId('action-publish')).toBeInTheDocument()
    })

    it('mounts the footer in upsell mode', async () => {
      await renderActionsWithTasksMode([PUBLISH_ACTION], Promise.resolve('upsell'))

      expect(await screen.findByTestId('tasks-footer-open-tasks')).toBeInTheDocument()
    })

    it('leaves the footer out when the feature check failed', async () => {
      await renderActionsWithTasksMode([PUBLISH_ACTION], Promise.resolve(null))

      expect(screen.getByTestId('action-publish')).toBeInTheDocument()
      expect(screen.queryByTestId('tasks-footer-open-tasks')).not.toBeInTheDocument()
    })

    it('keeps the other actions visible while the tasks mode is still pending', () => {
      // Never settles, so a Suspense boundary wrapped around the whole action row would hide Publish.
      const pending = new Promise<'default'>(() => {})
      render(
        <TasksModePromiseContext value={pending}>
          <DocumentActionsStateContext.Provider value={[PUBLISH_ACTION]}>
            <DocumentStatusBarActions />
          </DocumentActionsStateContext.Provider>
        </TasksModePromiseContext>,
        {wrapper: TestProvider},
      )

      expect(screen.getByTestId('action-publish')).toBeInTheDocument()
      expect(screen.queryByTestId('tasks-footer-open-tasks')).not.toBeInTheDocument()
    })
  })
})
