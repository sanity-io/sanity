import {type ToastContextValue, useToast} from '@sanity/ui/toast'
import {renderHook} from '@testing-library/react'
import {act, type ReactNode} from 'react'
import {
  TasksModePromiseContext,
  TasksNavigationContext,
  TasksUpsellContext,
} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {SETTLED_WITHOUT_UPSELL_DATA} from '../../hooks/useUpsellData'
import {type TasksMode} from '../context/enabled/types'
import {type TasksNavigationContextValue} from '../context/navigation/types'
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
  upsellDataPromise: SETTLED_WITHOUT_UPSELL_DATA,
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

function createWrapper(mode: TasksMode) {
  const modePromise = Promise.resolve<TasksMode>(mode)
  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <TasksModePromiseContext value={modePromise}>
        <TasksNavigationContext value={navigation}>
          <TasksUpsellContext value={upsell}>{children}</TasksUpsellContext>
        </TasksNavigationContext>
      </TasksModePromiseContext>
    )
  }
}

async function runAction(mode: TasksMode) {
  const {result} = renderHook(() => TaskCreateAction(), {wrapper: createWrapper(mode)})
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
})
