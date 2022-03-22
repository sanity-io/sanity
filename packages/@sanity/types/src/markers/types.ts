import type {ValidationError} from '../validation'
import type {Path} from '../paths'

export type Marker = ValidationMarker

interface BaseMarker {
  /**
   * The sanity path _relative to the root of the current document_ to this
   * marker.
   *
   * NOTE: Sanity paths may contain keyed segments (i.e. `{_key: string}`) that
   * are not compatible with deep getters like lodash/get
   */
  path: Path
}

export interface ValidationMarker extends BaseMarker {
  type: 'validation'
  level: 'error' | 'warning' | 'info'
  item: ValidationError
}
