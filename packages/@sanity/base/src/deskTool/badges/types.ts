import type {EditStateFor} from '../../datastores'

export interface DocumentBadgeDescription {
  title?: string
  label?: string | undefined
  color?: 'primary' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode | React.ComponentType
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentBadgeProps extends EditStateFor {}

export interface DocumentBadgeComponent {
  (props: DocumentBadgeProps): DocumentBadgeDescription | null
}
