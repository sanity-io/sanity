export interface DialogAction {
  key?: string
  index?: number
  color?: 'warning' | 'success' | 'danger' | 'primary' | 'white'
  title: string
  icon?: React.ComponentType<{}>
  tooltip?: string
  kind?: 'simple' | 'secondary'
  autoFocus?: boolean
  primary?: boolean
  secondary?: boolean
  inverted?: boolean
  disabled?: boolean
  action?: () => void
}
