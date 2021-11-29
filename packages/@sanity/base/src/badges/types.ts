import type {EditStateFor} from '../datastores/document/document-pair/editState'

export interface DocumentBadgeDescription {
  title?: string
  label?: string | undefined
  color?: 'primary' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode | React.ComponentType
}

export interface DocumentBadgeComponent {
  (props: EditStateFor): DocumentBadgeDescription | null
}
