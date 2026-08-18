import {type SearchParam} from 'sanity/router'

/**
 * Intent parameters (json)
 *
 * @public
 */
export type IntentJsonParams = {[key: string]: any}

/**
 * Base intent parameters
 *
 * @public
 */
export interface BaseIntentParams {
  /**
   * Document schema type name to create/edit.
   * Required for `create` intents, optional for `edit` (but encouraged, safer and faster)
   */
  type?: string

  /**
   * ID of the document to create/edit.
   * Required for `edit` intents, optional for `create`.
   */
  id?: string

  /**
   * Name (ID) of initial value template to use for `create` intent. Optional.
   */
  template?: string

  /**
   * Experimental field path
   *
   * @beta
   * @experimental
   * @hidden
   */
  path?: string

  /**
   * Optional "mode" to use for edit intent.
   * Known modes are `structure` and `presentation`.
   */
  mode?: string

  /**
   * Arbitrary/custom parameters are generally discouraged - try to keep them to a minimum,
   * or use `payload` (arbitrary JSON-serializable object) instead.
   */
  [key: string]: string | undefined
}

/**
 * Intent parameters
 * See {@link BaseIntentParams} and {@link IntentJsonParams}
 *
 * @public
 */
export type IntentParams = BaseIntentParams | [BaseIntentParams, IntentJsonParams]

/**
 * Interface for intents
 * @public */
export interface Intent {
  /** Intent type */
  type: string
  /** Intent parameters. See {@link IntentParams}
   */
  params?: IntentParams

  searchParams?: SearchParam[]
}
