import {FieldMember} from './members'

export interface FieldsetState {
  name: string
  level: number
  title?: string
  description?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  fields: FieldMember[]
}
