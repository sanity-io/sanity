import {Path} from '@sanity/types'

export interface NodeValidation {
  level: 'error' | 'warning' | 'info'
  message: string
  path: Path
}
