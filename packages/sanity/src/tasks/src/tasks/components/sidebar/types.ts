import {Dispatch, SetStateAction} from 'react'

export type SidebarTabsIds = 'assigned' | 'created' | 'document'
export interface TasksTab {
  id: SidebarTabsIds
  label: string
}

export interface TasksLayoutProps {
  activeTabId: string
  onChange: Dispatch<SetStateAction<SidebarTabsIds>>
  tabs: TasksTab[]
}
