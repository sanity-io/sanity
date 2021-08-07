/// <reference types="react" />
export declare type DialogColor = 'warning' | 'success' | 'danger' | 'primary' | 'white'
export interface DialogAction {
  key?: string
  index?: number
  color?: DialogColor
  title: string
  icon?: React.ComponentType<Record<string, unknown>>
  tooltip?: string
  kind?: 'simple' | 'secondary'
  autoFocus?: boolean
  primary?: boolean
  secondary?: boolean
  inverted?: boolean
  disabled?: boolean
  action?: () => void
}
