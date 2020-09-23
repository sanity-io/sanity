import {ValidationError} from '../validation'
import {Path} from '../paths'

export type Marker = ValidationMarker

interface BaseMarker {
  path: Path
}

export interface ValidationMarker extends BaseMarker {
  type: 'validation'
  level: 'error' | 'warning'
  item: ValidationError
}
