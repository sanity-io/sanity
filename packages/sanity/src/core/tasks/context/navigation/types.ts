import {type TaskDocument} from '../../types'

/** Query parameter keys used for tasks sidebar deep-linking */
export const TASKS_SIDEBAR_SEARCH_PARAM = 'sidebar'
export const TASKS_SELECTED_TASK_SEARCH_PARAM = 'selectedTask'
export const TASKS_VIEW_MODE_SEARCH_PARAM = 'viewMode'

export type SidebarTabsIds = 'assigned' | 'subscribed' | 'document'

export type ViewMode = 'create' | 'edit' | 'list' | 'draft' | 'duplicate'

export interface State {
  isOpen: boolean
  viewMode: ViewMode
  selectedTask: null | string
  activeTabId: SidebarTabsIds
  duplicateTaskValues: null | TaskDocument
}

export type ViewModeOptions =
  | {
      type: 'list' | 'create'
    }
  | {
      type: 'edit'
      id: string
    }
  | {
      type: 'duplicate'
      duplicateTaskValues: TaskDocument
    }
  | {
      type: 'draft'
      id: string
    }

export type Action =
  | {type: 'CREATE_TASK'}
  | {type: 'TOGGLE_TASKS_VIEW'; payload: boolean}
  | {type: 'NAVIGATE_TO_LIST'}
  | {type: 'EDIT_TASK'; payload: {id: string}}
  | {type: 'EDIT_DRAFT'; payload: {id: string}}
  | {type: 'SET_ACTIVE_TAB'; payload: SidebarTabsIds}
  | {type: 'DUPLICATE_TASK'; payload: {duplicateTaskValues: TaskDocument}}

export type TasksNavigationContextValue = {
  state: State
  setActiveTab: (id: SidebarTabsIds) => void
  setViewMode: (options: ViewModeOptions) => void
  handleCloseTasks: () => void
  handleCopyLinkToTask: () => void
  handleOpenTasks: () => void
}
