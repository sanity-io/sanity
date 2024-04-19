import {type SidebarTabsIds} from './context'

const TASKS_STATE_KEY = 'sanityStudio:tasks:visibleState'

type TasksState = SidebarTabsIds | null

export function setTasksVisibleLocalStorageState(newState: TasksState): void {
  if (newState) {
    localStorage.setItem(TASKS_STATE_KEY, JSON.stringify(newState))
  } else {
    localStorage.removeItem(TASKS_STATE_KEY)
  }
}

export function getTasksVisibleLocalStorageState(): TasksState {
  const value = localStorage.getItem(TASKS_STATE_KEY)
  return value ? JSON.parse(value) : null
}
