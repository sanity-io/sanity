import {type Path} from '../paths'
import {type ValidationError} from '../validation'

/** @public */
export interface ValidationMarker {
  level: 'error' | 'warning' | 'info'

  /**
   * The validation message for this marker. E.g. "Must be greater than 0"
   */
  message: string
  /**
   * @deprecated use `message` instead
   */
  item?: ValidationError
  /**
   * The sanity path _relative to the root of the current document_ to this
   * marker.
   *
   * NOTE: Sanity paths may contain keyed segments (i.e. `{_key: string}`) that
   * are not compatible with deep getters like lodash/get
   */
  path: Path

  /**
   * Extra metadata for the validation marker. Currently used by the Media Library asset source to ignore
   * certain validation markers when validating asset source media library assets.
   *
   * @internal
   */
  __internal_metadata?: unknown
}
