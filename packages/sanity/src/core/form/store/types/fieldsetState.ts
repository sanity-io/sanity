import {type Path} from '@sanity/types'
import {type GridTemplateColumns, type ResponsiveProp} from '@sanity/ui/css'

import {type FieldError} from './memberErrors'
import {type FieldMember} from './members'

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
  columns?: ResponsiveProp<GridTemplateColumns>
  members: (FieldMember | FieldError)[]
}
