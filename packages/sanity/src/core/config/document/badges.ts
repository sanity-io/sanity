import {EditStateFor} from '../../store'

/**
 * @hidden
 * @beta */
export interface DocumentBadgeDescription {
  title?: string
  label?: string | undefined
  color?: 'primary' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode | React.ComponentType
}

/**
 * @hidden
 * @beta */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentBadgeProps extends EditStateFor {}

/**
 * @hidden
 * @beta */
export interface DocumentBadgeComponent {
  (props: DocumentBadgeProps): DocumentBadgeDescription | null
}
