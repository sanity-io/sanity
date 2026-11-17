import {type ToastContextValue, useToast} from '@sanity/ui/toast'
import {renderHook} from '@testing-library/react'
import {act, type ReactNode, Suspense} from 'react'
import {
  TasksContext,
  TasksModePromiseContext,
  TasksNavigationContext,
  TasksUpsellContext,
} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentActionDescription} from '../../config/document/actions'
import {type TasksMode} from '../context/enabled/types'
import {type TasksNavigationContextValue} from '../context/navigation/types'
import {type TasksContextValue} from '../context/tasks/types'
import {type TasksUpsellContextValue} from '../context/upsell/types'
import {TaskCreateAction} from './TaskCreateAction'

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('@sanity/ui/toast', async () => {
  const actual = await vi.importActual('@sanity/ui/toast')
  const useToastMock = vi.fn()
  return new Proxy(actual, {
    get: (target, property: keyof typeof actual) => {
      if (property === 'useToast') return useToastMock
      return target[property]
    },
  })
})

const mockUseToast = vi.mocked(useToast)

const navigation = {
  state: {
    activeTabId: 'assigned',
    viewMode: 'list',
    selectedTask: null,
    isOpen: false,
    duplicateTaskValues: null,
  },
  setActiveTab: vi.fn(),
  setViewMode: vi.fn(),
  handleCloseTasks: vi.fn(),
  handleCopyLinkToTask: vi.fn(),
  handleOpenTasks: vi.fn(),
} satisfies TasksNavigationContextValue

const upsell = {
  upsellDataPromise: null,
  handleOpenDialog: vi.fn(),
  handleClose: vi.fn(),
  upsellDialogOpen: false,
  telemetryLogs: {
    dialogSecondaryClicked: vi.fn(),
    dialogPrimaryClicked: vi.fn(),
    panelViewed: vi.fn(),
    panelDismissed: vi.fn(),
    panelPrimaryClicked: vi.fn(),
    panelSecondaryClicked: vi.fn(),
  },
} satisfies TasksUpsellContextValue

const toast = {push: vi.fn(() => 'toast-id'), version: 0.0} satisfies ToastContextValue

const tasks = {
  activeDocument: {documentId: 'doc-a', documentType: 'article'},
  setActiveDocument: vi.fn(),
  data: [],
  isLoading: false,
} satisfies TasksContextValue

function Wrapper({children, mode}: {children: ReactNode; mode: Promise<TasksMode>}) {
  return (
    <TasksModePromiseContext value={mode}>
      <TasksContext value={tasks}>
        <TasksNavigationContext value={navigation}>
          <TasksUpsellContext value={upsell}>
            <Suspense fallback={null}>{children}</Suspense>
          </TasksUpsellContext>
        </TasksNavigationContext>
      </TasksContext>
    </TasksModePromiseContext>
  )
}

// The action reads the mode with `use()`, so its first render suspends on the promise: mount inside
// an awaited async `act` (see AGENTS.md) and read the description once it has settled
async function mountAction(mode: TasksMode): Promise<DocumentActionDescription | null> {
  let result!: {current: DocumentActionDescription | null}
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the hook suspends on mount; React only resumes it inside an awaited act
  await act(async () => {
    ;({result} = renderHook(() => TaskCreateAction(), {
      wrapper: ({children}) => (
        <Wrapper mode={Promise.resolve<TasksMode>(mode)}>{children}</Wrapper>
      ),
    }))
  })
  return result.current
}

async function runAction(mode: TasksMode) {
  const action = await mountAction(mode)
  act(() => {
    action?.onHandle?.()
  })
}

describe('TaskCreateAction', () => {
  beforeEach(() => {
    mockUseToast.mockReturnValue(toast)
  })

  it('renders the action once the mode has settled', async () => {
    const action = await mountAction('default')

    expect(action).toMatchObject({label: 'actions.create.text', group: ['paneActions']})
  })

  it('opens the sidebar in create mode when the plan has tasks', async () => {
    await runAction('default')

    expect(navigation.handleOpenTasks).toHaveBeenCalledOnce()
    expect(navigation.setViewMode).toHaveBeenCalledWith({type: 'create'})
    expect(upsell.handleOpenDialog).not.toHaveBeenCalled()
    expect(toast.push).not.toHaveBeenCalled()
  })

  it('opens the upsell dialog when the plan lacks tasks', async () => {
    await runAction('upsell')

    expect(upsell.handleOpenDialog).toHaveBeenCalledWith('document_action')
    expect(navigation.handleOpenTasks).not.toHaveBeenCalled()
    expect(navigation.setViewMode).not.toHaveBeenCalled()
    expect(toast.push).not.toHaveBeenCalled()
  })

  it('fails closed with an error toast when the feature check failed', async () => {
    await runAction(null)

    expect(toast.push).toHaveBeenCalledWith(
      expect.objectContaining({status: 'error', title: 'errors.unable-to-perform-action'}),
    )
    expect(navigation.handleOpenTasks).not.toHaveBeenCalled()
    expect(navigation.setViewMode).not.toHaveBeenCalled()
    expect(upsell.handleOpenDialog).not.toHaveBeenCalled()
  })
})
