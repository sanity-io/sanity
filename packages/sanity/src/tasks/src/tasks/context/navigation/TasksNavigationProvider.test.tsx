import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react'

import {TaskLinkCopied, TaskLinkOpened} from '../../../../__telemetry__/tasks.telemetry'
import {type TaskDocument} from '../../types'
import {TasksNavigationProvider} from './TasksNavigationProvider'
import {useTasksNavigation} from './useTasksNavigation'

const mockToastPush = jest.fn()
jest.mock('@sanity/ui', () => {
  return {
    useToast: jest.fn(() => ({push: mockToastPush})),
  }
})

jest.mock('sanity/router', () => ({
  useRouter: jest.fn(() => {
    return {
      state: {
        _searchParams: [],
      },
    }
  }),
}))

const mockTelemetryLog = jest.fn()
jest.mock('@sanity/telemetry/react', () => {
  return {
    useTelemetry: jest.fn(() => ({
      log: mockTelemetryLog,
    })),
  }
})

const mockWriteText = jest.fn(() => Promise.resolve())
Object.defineProperty(navigator, 'clipboard', {
  value: {writeText: mockWriteText},
})

Object.defineProperty(window, 'location', {
  value: new URL('http://localhost:3333/'),
})

describe('useTasksNavigation', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('should open the tasks view', () => {
    const {result} = renderHook(() => useTasksNavigation(), {
      wrapper: TasksNavigationProvider,
    })

    act(() => {
      result.current.handleOpenTasks()
    })

    expect(result.current.state.isOpen).toBe(true)
  })

  it('should allow to switch between tabs', () => {
    const {result} = renderHook(() => useTasksNavigation(), {
      wrapper: TasksNavigationProvider,
    })

    act(() => {
      result.current.handleOpenTasks()
    })
    expect(result.current.state.isOpen).toBe(true)
    expect(result.current.state.activeTabId).toBe('assigned')

    act(() => {
      result.current.setActiveTab('subscribed')
    })
    expect(result.current.state.activeTabId).toBe('subscribed')

    act(() => {
      result.current.setActiveTab('document')
    })
    expect(result.current.state.activeTabId).toBe('document')
  })
  it('should reset the state when closing the view', () => {
    const {result} = renderHook(() => useTasksNavigation(), {
      wrapper: TasksNavigationProvider,
    })

    act(() => {
      result.current.handleOpenTasks()
      result.current.setActiveTab('subscribed')
    })

    expect(result.current.state.isOpen).toBe(true)
    expect(result.current.state.activeTabId).toBe('subscribed')

    act(() => {
      result.current.handleCloseTasks()
    })

    expect(result.current.state.isOpen).toBe(false)
    expect(result.current.state.activeTabId).toBe('assigned')
  })
  it('should support changing the view mode and resetting the states', () => {
    const {result} = renderHook(() => useTasksNavigation(), {
      wrapper: TasksNavigationProvider,
    })

    act(() => {
      result.current.handleOpenTasks()
      result.current.setViewMode({type: 'create'})
    })
    expect(result.current.state.isOpen).toBe(true)
    expect(result.current.state.viewMode).toBe('create')

    act(() => {
      result.current.setViewMode({type: 'edit', id: '123'})
    })
    expect(result.current.state.viewMode).toBe('edit')
    expect(result.current.state.selectedTask).toBe('123')

    act(() => {
      result.current.setViewMode({
        type: 'duplicate',
        duplicateTaskValues: {title: 'foo'} as unknown as TaskDocument,
      })
    })
    expect(result.current.state.viewMode).toBe('duplicate')
    expect(result.current.state.duplicateTaskValues).toEqual({title: 'foo'})
    act(() => {
      result.current.setViewMode({type: 'list'})
    })
    expect(result.current.state.viewMode).toBe('list')
    expect(result.current.state.duplicateTaskValues).toEqual(null)

    act(() => {
      result.current.setViewMode({
        type: 'draft',
        id: 'draft-document',
      })
    })
    expect(result.current.state.viewMode).toBe('draft')
    expect(result.current.state.selectedTask).toBe('draft-document')
    act(() => {
      result.current.setViewMode({type: 'list'})
    })
    expect(result.current.state.viewMode).toBe('list')
    expect(result.current.state.duplicateTaskValues).toEqual(null)
    expect(result.current.state.selectedTask).toBe(null)
  })

  it('should support copying tasks links', () => {
    const {result} = renderHook(() => useTasksNavigation(), {
      wrapper: TasksNavigationProvider,
    })

    act(() => {
      result.current.handleOpenTasks()
      result.current.setViewMode({type: 'edit', id: '123'})
    })
    expect(result.current.state.selectedTask).toBe('123')
    act(() => {
      result.current.handleCopyLinkToTask()
    })
    waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        'http://localhost:3333/?sidebar=tasks&viewMode=edit&selectedTask=123',
      )
      expect(mockToastPush).toHaveBeenCalledWith({
        closable: true,
        status: 'info',
        title: 'Copied link to clipboard',
      })
      expect(mockTelemetryLog).toHaveBeenCalledWith(TaskLinkCopied)
    })
  })

  it('should redirect to the task if it is in the router', () => {
    require('sanity/router').useRouter.mockReturnValueOnce({
      state: {
        _searchParams: [
          ['sidebar', 'tasks'],
          ['viewMode', 'edit'],
          ['selectedTask', '2187ff8d-5adc-49a1-9ae6-148651d1b048'],
        ],
      },
    })

    const {result} = renderHook(() => useTasksNavigation(), {
      wrapper: TasksNavigationProvider,
    })

    waitFor(() => {
      expect(result.current.state.viewMode).toBe('edit')
      expect(result.current.state.isOpen).toBe(true)
      expect(result.current.state.selectedTask).toBe('2187ff8d-5adc-49a1-9ae6-148651d1b048')
    })
    expect(mockTelemetryLog).toHaveBeenCalledWith(TaskLinkOpened)
  })
})
