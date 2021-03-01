export type ButtonColor = 'primary' | 'success' | 'danger' | 'white' | 'warning'
export type ButtonKind = 'simple' | 'secondary'
export type ButtonPadding = 'small' | 'medium' | 'large' | 'none'
export type ButtonSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'

export interface ButtonProps extends Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'ref'> {
  bleed?: boolean
  color?: ButtonColor
  icon?: React.ComponentType<Record<string, unknown>>
  iconStatus?: 'primary' | 'success' | 'warning' | 'danger'
  inverted?: boolean
  kind?: ButtonKind
  loading?: boolean
  padding?: ButtonPadding
  ref?: React.Ref<any /* @todo: ButtonLike */>
  selected?: boolean
  size?: ButtonSize
  tone?: 'navbar'
}

export type ButtonComponent = React.ComponentType<ButtonProps>
