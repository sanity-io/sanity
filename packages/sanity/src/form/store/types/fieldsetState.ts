import {Path} from '@sanity/types'
import {FieldMember} from './members'

export interface FieldsetState {
  path: Path
  name: string
  level: number
  title?: string
  description?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  fields: FieldMember[]
}
