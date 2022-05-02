import {FieldMember} from './members'

export interface FieldsetState {
  name: string
  title?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  fields: FieldMember[]
}
