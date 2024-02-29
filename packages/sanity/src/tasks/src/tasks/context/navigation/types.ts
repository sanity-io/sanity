export type SidebarTabsIds = 'assigned' | 'created' | 'document'

export type ViewMode = 'create' | 'edit' | 'list'

export type TasksNavigationContextValue = {
  activeTabId: SidebarTabsIds
  selectedTask: null | string
  setActiveTabId: (id: SidebarTabsIds) => void
  setSelectedTask: (id: null | string) => void
  setViewMode: (mode: ViewMode) => void
  viewMode: ViewMode
}
