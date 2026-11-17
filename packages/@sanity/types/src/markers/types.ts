import {type Path} from '../paths/types'
import {type ValidationError} from '../validation/types'

/** @public */
export interface ValidationMarker {
  level: 'error' | 'warning' | 'info'

  /**
   * A machine-readable identifier for the validation failure.
   *
   * Built-in validators use stable codes exported by `@sanity/validation`.
   * Custom validators may provide their own code.
   */
  code?: string

  /** Structured information about the validation failure. */
  details?: Record<string, unknown>

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
