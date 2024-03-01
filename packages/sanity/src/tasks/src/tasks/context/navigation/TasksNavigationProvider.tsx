import {uuid} from '@sanity/uuid'
import {type ReactNode, useCallback, useReducer} from 'react'

import {TasksNavigationContext} from './TasksNavigationContext'
import {type Action, type SidebarTabsIds, type State, type ViewModeOptions} from './types'

const initialState: State = {
  viewMode: 'list',
  selectedTask: null,
  activeTabId: 'assigned',
  duplicateTaskValues: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
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

  const editTask = useCallback((id: string) => {
    dispatch({type: 'EDIT_TASK', payload: {id}})
  }, [])

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

  return (
    <TasksNavigationContext.Provider value={{state, editTask, setViewMode, setActiveTab}}>
      {children}
    </TasksNavigationContext.Provider>
  )
}
