import {CSSProperties} from 'react'

export interface DocumentStatusBarActionsProps {
  id: string
  type: string
  states: any[]
  disabled: boolean
  isMenuOpen: boolean
  showMenu: boolean
  onMenuOpen: () => void
  onMenuClose: () => void
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

export interface Badge {
  title: string
  label?: string | undefined
  color?: string
  icon?: any
}
