export type SidebarTabsIds = 'assigned' | 'subscribed' | 'document'

export type ViewMode = 'create' | 'edit' | 'list'

export interface State {
  viewMode: ViewMode
  selectedTask: null | string
  activeTabId: SidebarTabsIds
}

export type ViewModeOptions =
  | {
      type: 'list' | 'create'
    }
  | {
      type: 'edit'
      id: string
    }

export type Action =
  | {type: 'CREATE_TASK'}
  | {type: 'NAVIGATE_TO_LIST'}
  | {type: 'EDIT_TASK'; payload: {id: string}}
  | {type: 'SET_ACTIVE_TAB'; payload: SidebarTabsIds}

export type TasksNavigationContextValue = {
  state: State
  setActiveTab: (id: SidebarTabsIds) => void
  editTask: (id: string) => void
  setViewMode: (options: ViewModeOptions) => void
}
