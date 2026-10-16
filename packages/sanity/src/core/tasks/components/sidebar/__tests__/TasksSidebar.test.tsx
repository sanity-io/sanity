import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act, Suspense} from 'react'
import {TasksModePromiseContext, TasksNavigationContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type TasksMode} from '../../../context/enabled/types'
import {type TasksNavigationContextValue} from '../../../context/navigation/types'
import {tasksUsEnglishLocaleBundle} from '../../../i18n'
import {TasksStudioSidebar} from '../TasksSidebar'

const navigation = {
  state: {
    activeTabId: 'assigned',
    viewMode: 'list',
    selectedTask: null,
    isOpen: true,
    duplicateTaskValues: null,
  },
  setActiveTab: vi.fn(),
  setViewMode: vi.fn(),
  handleCloseTasks: vi.fn(),
  handleCopyLinkToTask: vi.fn(),
  handleOpenTasks: vi.fn(),
} satisfies TasksNavigationContextValue

async function renderSidebar(mode: TasksMode) {
  const wrapper = await createTestProvider({resources: [tasksUsEnglishLocaleBundle]})
  const modePromise = Promise.resolve<TasksMode>(mode)
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the sidebar suspends on the mode promise; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <TasksModePromiseContext value={modePromise}>
        <TasksNavigationContext value={navigation}>
          <Suspense fallback={<span>pending</span>}>
            <TasksStudioSidebar />
          </Suspense>
        </TasksNavigationContext>
      </TasksModePromiseContext>,
      {wrapper},
    )
  })
}

describe('TasksStudioSidebar', () => {
  it('lists tasks with the tabs and an enabled New button when the plan has tasks', async () => {
    await renderSidebar('default')

    expect(await screen.findByRole('tab', {name: 'Assigned'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'New task'})).toBeEnabled()
    expect(screen.queryByText('Tasks are unavailable right now. Try again later.')).toBeNull()
  })

  it('reads as unavailable when the feature check failed, but can still be closed', async () => {
    // A failed check leaves the plan unknown, so the sidebar fails closed like comments and
    // scheduled publishing do, instead of exposing task creation
    await renderSidebar(null)

    expect(
      await screen.findByText('Tasks are unavailable right now. Try again later.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('tab')).toBeNull()
    const newButton = screen.getByRole('button', {name: 'New task'})
    expect(newButton).toBeDisabled()

    // The header's other button is the icon-only close control
    const closeButton = screen.getAllByRole('button').find((button) => button !== newButton)
    await userEvent.click(closeButton!)
    expect(navigation.handleCloseTasks).toHaveBeenCalledOnce()
  })
})
