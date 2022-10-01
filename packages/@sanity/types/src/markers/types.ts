import type {ValidationError} from '../validation'
import type {Path} from '../paths'

/** @public */
export interface ValidationMarker {
  level: 'error' | 'warning' | 'info'
  item: ValidationError
  /**
   * The sanity path _relative to the root of the current document_ to this
   * marker.
   *
   * NOTE: Sanity paths may contain keyed segments (i.e. `{_key: string}`) that
   * are not compatible with deep getters like lodash/get
   */
  path: Path
}
