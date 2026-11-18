import {LayerProvider, studioTheme, ThemeProvider, useMediaIndex} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {act} from 'react'
import {TasksModePromiseContext, TasksNavigationContext} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type Tool} from '../../config/types'
import {type TasksMode} from '../context/enabled/types'
import {type TasksNavigationContextValue} from '../context/navigation/types'
import TasksStudioActiveToolLayout from './TasksStudioActiveToolLayout'

vi.mock(import('@sanity/ui'), async (importOriginal) => {
  const actual = await importOriginal()
  return {...actual, useMediaIndex: vi.fn(() => 2)}
})

const tool: Tool = {name: 'structure', title: 'Structure', component: () => null}

afterEach(() => {
  vi.mocked(useMediaIndex).mockReturnValue(2)
})

const openSidebar = {
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

describe('TasksStudioActiveToolLayout', () => {
  it('shows the sidebar as loading while the feature check is pending, next to the tool', async () => {
    // The sidebar can be open before the check settles (a `?sidebar=tasks` link, the navbar
    // button right after the first paint), so the boundary around it must not fall back to nothing
    const pending = new Promise<TasksMode>(() => {})

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the sidebar suspends on the mode promise
    await act(async () => {
      render(
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        <ThemeProvider theme={studioTheme}>
          <LayerProvider>
            <TasksModePromiseContext value={pending}>
              <TasksNavigationContext value={openSidebar}>
                <TasksStudioActiveToolLayout
                  activeTool={tool}
                  renderDefault={() => <div data-testid="tool" />}
                />
              </TasksNavigationContext>
            </TasksModePromiseContext>
          </LayerProvider>
        </ThemeProvider>,
      )
    })

    expect(screen.getByTestId('tool')).toBeInTheDocument()
    expect(screen.getByTestId('tasks-sidebar-loading')).toBeInTheDocument()
  })

  it('locks the structure pane layout while the fullscreen sidebar is open', async () => {
    vi.mocked(useMediaIndex).mockReturnValue(0)
    const pending = new Promise<TasksMode>(() => {})

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the sidebar suspends on the mode promise
    await act(async () => {
      render(
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        <ThemeProvider theme={studioTheme}>
          <style>{'.scrolls { overflow: auto }'}</style>
          <LayerProvider>
            <TasksModePromiseContext value={pending}>
              <TasksNavigationContext value={openSidebar}>
                <TasksStudioActiveToolLayout
                  activeTool={tool}
                  renderDefault={() => (
                    <div className="scrolls" data-testid="pane-layout" data-ui="PaneLayout" />
                  )}
                />
              </TasksNavigationContext>
            </TasksModePromiseContext>
          </LayerProvider>
        </ThemeProvider>,
      )
    })

    expect(getComputedStyle(screen.getByTestId('pane-layout')).overflow).toBe('hidden')
  })
})
