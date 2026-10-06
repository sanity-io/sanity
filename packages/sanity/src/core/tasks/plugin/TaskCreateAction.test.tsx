import {type ToastContextValue, useToast} from '@sanity/ui/toast'
import {renderHook} from '@testing-library/react'
import {act, type ReactNode} from 'react'
import {
  TasksContext,
  TasksModePromiseContext,
  TasksNavigationContext,
  TasksUpsellContext,
} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type TasksMode} from '../context/enabled/types'
import {type TasksNavigationContextValue} from '../context/navigation/types'
import {type ActiveDocument, type TasksContextValue} from '../context/tasks/types'
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

function tasksContext(activeDocument: ActiveDocument | null): TasksContextValue {
  return {activeDocument, setActiveDocument: vi.fn(), data: [], isLoading: false}
}

// The wrapper reads the active document on every render, so a test can move the pane on between
// renders the way `SetActiveDocument` does
function createWrapper(
  modePromise: Promise<TasksMode>,
  getActiveDocument: () => ActiveDocument | null = () => null,
) {
  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <TasksModePromiseContext value={modePromise}>
        <TasksContext value={tasksContext(getActiveDocument())}>
          <TasksNavigationContext value={navigation}>
            <TasksUpsellContext value={upsell}>{children}</TasksUpsellContext>
          </TasksNavigationContext>
        </TasksContext>
      </TasksModePromiseContext>
    )
  }
}

async function runAction(mode: TasksMode) {
  const {result} = renderHook(() => TaskCreateAction(), {
    wrapper: createWrapper(Promise.resolve<TasksMode>(mode)),
  })
  await act(async () => {
    // Typed as returning `void`, but the handler awaits the mode before it acts
    await Promise.resolve(result.current?.onHandle?.())
  })
}

describe('TaskCreateAction', () => {
  beforeEach(() => {
    mockUseToast.mockReturnValue(toast)
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

  it('does nothing when the active document changed while the feature check was pending', async () => {
    // The task form targets whichever document is active when it opens, so an action invoked on
    // one document must not open the form for the document the user moved on to
    let settle!: (mode: TasksMode) => void
    const modePromise = new Promise<TasksMode>((resolve) => {
      settle = resolve
    })
    let activeDocument: ActiveDocument = {documentId: 'doc-a', documentType: 'article'}
    const {result, rerender} = renderHook(() => TaskCreateAction(), {
      wrapper: createWrapper(modePromise, () => activeDocument),
    })

    let handled!: Promise<void>
    act(() => {
      handled = Promise.resolve(result.current?.onHandle?.())
    })
    activeDocument = {documentId: 'doc-b', documentType: 'article'}
    rerender()
    await act(async () => {
      settle('default')
      await handled
    })

    expect(navigation.handleOpenTasks).not.toHaveBeenCalled()
    expect(navigation.setViewMode).not.toHaveBeenCalled()
    expect(toast.push).not.toHaveBeenCalled()
  })

  it('does nothing when the pane it was invoked from unmounted while the feature check was pending', async () => {
    // Once the pane is gone the action no longer sees the active document move on, so the
    // document comparison alone would let a stale invocation open the form for the next document
    let settle!: (mode: TasksMode) => void
    const modePromise = new Promise<TasksMode>((resolve) => {
      settle = resolve
    })
    const {result, unmount} = renderHook(() => TaskCreateAction(), {
      wrapper: createWrapper(modePromise, () => ({documentId: 'doc-a', documentType: 'article'})),
    })

    let handled!: Promise<void>
    act(() => {
      handled = Promise.resolve(result.current?.onHandle?.())
    })
    unmount()
    await act(async () => {
      settle('default')
      await handled
    })

    expect(navigation.handleOpenTasks).not.toHaveBeenCalled()
    expect(navigation.setViewMode).not.toHaveBeenCalled()
    expect(toast.push).not.toHaveBeenCalled()
  })

  it('goes through when the same document is still active once the feature check answers', async () => {
    let settle!: (mode: TasksMode) => void
    const modePromise = new Promise<TasksMode>((resolve) => {
      settle = resolve
    })
    const {result, rerender} = renderHook(() => TaskCreateAction(), {
      wrapper: createWrapper(modePromise, () => ({documentId: 'doc-a', documentType: 'article'})),
    })

    let handled!: Promise<void>
    act(() => {
      handled = Promise.resolve(result.current?.onHandle?.())
    })
    rerender()
    await act(async () => {
      settle('default')
      await handled
    })

    expect(navigation.handleOpenTasks).toHaveBeenCalledOnce()
    expect(navigation.setViewMode).toHaveBeenCalledWith({type: 'create'})
  })
})
