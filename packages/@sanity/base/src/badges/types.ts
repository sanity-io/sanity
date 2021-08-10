import {EditStateFor} from '../datastores/document/document-pair/editState'

export interface DocumentBadgeDescription {
  title?: string
  label?: string | undefined
  color?: string
  icon?: any
}

export interface DocumentBadgeComponent {
  (props: EditStateFor): DocumentBadgeDescription | null
}
