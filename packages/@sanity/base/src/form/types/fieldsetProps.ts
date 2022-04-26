import {FieldMember} from './member'

export interface FieldSetProps {
  name: string
  title?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  // onSetCollapsed: (collapsed: boolean) => void
  fields: FieldMember[]
}
