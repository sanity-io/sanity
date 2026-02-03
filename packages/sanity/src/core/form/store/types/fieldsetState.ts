import {type FieldError} from './memberErrors'
import {type DecorationMember, type FieldMember} from './members'
import {type Path} from '@sanity/types'

/**
 * @hidden
 * @public */
export type FieldsetMembers = FieldMember | FieldError | DecorationMember

/**
 * @hidden
 * @beta */
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
  members: FieldsetMembers[]
}
