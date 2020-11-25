/// <reference types="react" />
export interface SnackbarAction {
  title?: string
  icon?: React.ReactNode
  callback?: () => void
}
export interface SnackbarItemType {
  action: Record<string, unknown>
  allowDuplicateSnackbarType: boolean
  autoDismissTimeout: number
  height: number
  icon: boolean
  id: number | string
  isCloseable: boolean
  isOpen: boolean
  isPersisted: boolean
  kind: 'info' | 'warning' | 'error' | 'success'
  title: string
  setAutoFocus: boolean
  setFocus: boolean
  subtitle: string
}
