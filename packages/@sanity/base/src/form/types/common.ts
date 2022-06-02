import {Path} from '@sanity/types'
import {FormFieldPresence} from '../../presence'

export type NodePresence = FormFieldPresence

export interface NodeValidation {
  level: 'error' | 'warning' | 'info'
  message: string
  path: Path
}
