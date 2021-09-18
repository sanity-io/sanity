export interface DocumentStatusBarActionsProps {
  id: string
  type: string
  states: any[]
  disabled: boolean
  showMenu: boolean
}

export interface HistoryStatusBarActionsProps {
  id: string
  type: string
  revision: string
}

export interface DocumentStatusBarProps {
  id: string
  type: string
  lastUpdated?: string | null
}
