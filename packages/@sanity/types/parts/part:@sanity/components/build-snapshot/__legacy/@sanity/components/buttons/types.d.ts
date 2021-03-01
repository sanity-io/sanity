/// <reference types="react" />
export declare type ButtonColor = 'primary' | 'success' | 'danger' | 'white' | 'warning'
export declare type ButtonKind = 'simple' | 'secondary'
export declare type ButtonPadding = 'small' | 'medium' | 'large' | 'none'
export declare type ButtonSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'
export interface ButtonProps extends Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'ref'> {
  bleed?: boolean
  color?: ButtonColor
  icon?: React.ComponentType<Record<string, unknown>>
  iconStatus?: 'primary' | 'success' | 'warning' | 'danger'
  inverted?: boolean
  kind?: ButtonKind
  loading?: boolean
  padding?: ButtonPadding
  ref?: React.Ref<any>
  selected?: boolean
  size?: ButtonSize
  tone?: 'navbar'
}
export declare type ButtonComponent = React.ComponentType<ButtonProps>
