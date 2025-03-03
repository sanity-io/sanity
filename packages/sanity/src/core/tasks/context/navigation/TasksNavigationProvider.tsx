import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {type ReactNode, useCallback, useEffect, useMemo, useReducer} from 'react'
import {TasksNavigationContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {TaskLinkCopied, TaskLinkOpened} from '../../__telemetry__/tasks.telemetry'
import {type Action, type SidebarTabsIds, type State, type ViewModeOptions} from './types'

const initialState: State = {
  viewMode: 'list',
  selectedTask: null,
  activeTabId: 'assigned',
  duplicateTaskValues: null,
  isOpen: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_TASKS_VIEW': {
      if (action.payload === false) {
        return {
          ...initialState,
          isOpen: action.payload,
        }
      }
      return {
        ...state,
        isOpen: action.payload,
      }
    }
    case 'CREATE_TASK':
      return {
        ...state,
        viewMode: 'create',
        selectedTask: uuid(),
      }
    case 'EDIT_TASK':
      return {
        ...state,
        viewMode: 'edit',
        selectedTask: action.payload.id,
      }
    case 'EDIT_DRAFT':
      return {
        ...state,
        viewMode: 'draft',
        selectedTask: action.payload.id,
      }
    case 'DUPLICATE_TASK':
      return {
        ...state,
        viewMode: 'duplicate',
        selectedTask: uuid(),
        duplicateTaskValues: action.payload.duplicateTaskValues,
      }
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        viewMode: 'list',
        activeTabId: action.payload,
      }
    case 'NAVIGATE_TO_LIST':
      return {
        ...state,
        viewMode: 'list',
      }
    default:
      return state
  }
}

export const TasksNavigationProvider = ({children}: {children: ReactNode}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const router = useRouter()
  const toast = useToast()
  const telemetry = useTelemetry()

  const setViewMode = useCallback((viewMode: ViewModeOptions) => {
    switch (viewMode.type) {
      case 'list':
        dispatch({type: 'NAVIGATE_TO_LIST'})
        break
      case 'create':
        dispatch({type: 'CREATE_TASK'})
        break
      case 'edit':
        dispatch({type: 'EDIT_TASK', payload: {id: viewMode.id}})
        break
      case 'duplicate':
        dispatch({
          type: 'DUPLICATE_TASK',
          payload: {duplicateTaskValues: viewMode.duplicateTaskValues},
        })
        break
      case 'draft':
        dispatch({type: 'EDIT_DRAFT', payload: {id: viewMode.id}})
        break
      default:
        break
    }
  }, [])

  const setActiveTab = useCallback((tabId: SidebarTabsIds) => {
    dispatch({type: 'SET_ACTIVE_TAB', payload: tabId})
  }, [])

  const handleCloseTasks = useCallback(() => {
    dispatch({type: 'TOGGLE_TASKS_VIEW', payload: false})
  }, [])

  const handleOpenTasks = useCallback(() => {
    dispatch({type: 'TOGGLE_TASKS_VIEW', payload: true})
  }, [])

  const handleCopyLinkToTask = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('sidebar', 'tasks')
    url.searchParams.set('viewMode', state.viewMode)
    if (state.selectedTask) {
      url.searchParams.set('selectedTask', state.selectedTask)
    }
    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        telemetry.log(TaskLinkCopied)
      })
      .catch(() => {
        toast.push({
          closable: true,
          status: 'error',
          title: 'Failed to copy link to clipboard',
        })
      })
  }, [state.selectedTask, state.viewMode, telemetry, toast])

  const searchParams = new URLSearchParams(router.state._searchParams)
  const sidebar = searchParams.get('sidebar')
  const viewMode = searchParams.get('viewMode')
  const selectedTask = searchParams.get('selectedTask')

  useEffect(() => {
    // listen to the URL to open the tasks view if the sidebar is set to task.
    if (sidebar !== 'tasks') {
      return
    }
    dispatch({type: 'TOGGLE_TASKS_VIEW', payload: true})
    if (viewMode === 'edit' && selectedTask) {
      dispatch({type: 'EDIT_TASK', payload: {id: selectedTask}})
      telemetry.log(TaskLinkOpened)
    }
  }, [selectedTask, sidebar, telemetry, viewMode])

  const value = useMemo(
    () => ({
      state,
      setViewMode,
      setActiveTab,
      handleCloseTasks,
      handleOpenTasks,
      handleCopyLinkToTask,
    }),
    [handleCloseTasks, handleCopyLinkToTask, handleOpenTasks, setActiveTab, setViewMode, state],
  )

  return <TasksNavigationContext.Provider value={value}>{children}</TasksNavigationContext.Provider>
}
