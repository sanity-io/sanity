export type ButtonComponent = React.ComponentType<{}> | 'button' | 'a'

export type ButtonColor = 'primary' | 'success' | 'danger' | 'white' | 'warning'
export type ButtonKind = 'simple' | 'secondary'
export type ButtonPadding = 'small' | 'medium' | 'large'
export type ButtonSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'

export interface ButtonProps {
  kind?: ButtonKind
  color?: ButtonColor
  onBlur?: (event: React.FocusEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  onClick?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  children?: React.ReactNode
  inverted?: boolean
  icon?: React.ComponentType<{}>
  iconStatus?: 'primary' | 'success' | 'warning' | 'danger'
  loading?: boolean
  className?: string
  disabled?: boolean
  tabIndex?: number
  padding?: ButtonPadding
  bleed?: boolean
  selected?: boolean
  size?: ButtonSize
}
