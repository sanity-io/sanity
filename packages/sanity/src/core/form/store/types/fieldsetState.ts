import {Path} from '@sanity/types'
import {FieldError} from './memberErrors'
import {FieldMember} from './members'

/** @beta */
export interface FieldsetState {
  path: Path
  name: string
  level: number
  title?: string
  description?: string
  hidden?: boolean
  collapsible?: boolean
  collapsed?: boolean
  columns?: number | number[]
  members: (FieldMember | FieldError)[]
}
