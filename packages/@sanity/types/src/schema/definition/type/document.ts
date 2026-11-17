import {type SanityDocument} from '../../../documents/types'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty, type SortOrdering} from '../../types'
import {type BaseSchemaTypeOptions} from './common'
import {type ObjectDefinition} from './object'

/**
 * This exists only to allow for extensions using declaration-merging.
 *
 * @public
 */
export interface DocumentOptions extends BaseSchemaTypeOptions {}

/** @public */
export interface DocumentRule extends RuleDef<DocumentRule, SanityDocument> {}

/**
 * A kind of version documents of a type can have, listed in the document type's `versions`.
 *
 * @beta
 */
export type DocumentVersionKind = 'releases' | 'variants'

/** @public */
export interface DocumentDefinition extends Omit<ObjectDefinition, 'type'> {
  type: 'document'
  liveEdit?: boolean
  /**
   * The kinds of versions documents of this type can have. Leave it unset to allow all of them,
   * use `['variants']` for variants only, or `[]` for none. Combine `[]` with `liveEdit: true` to
   * also skip drafts, so the document is only ever edited in place.
   *
   * @defaultValue ['releases', 'variants']
   * @beta
   */
  versions?: DocumentVersionKind[]
  /** @beta */
  orderings?: SortOrdering[]
  options?: DocumentOptions
  validation?: ValidationBuilder<DocumentRule, SanityDocument>
  initialValue?: InitialValueProperty<any, Record<string, unknown>>
  /** @deprecated Unused. Use the new field-level search config. */
  __experimental_search?: {path: string; weight: number; mapWith?: string}[]
  /** @alpha */
  __experimental_omnisearch_visibility?: boolean
  /**
   * Determines whether the large preview title is displayed in the document pane form
   * @alpha
   * */
  __experimental_formPreviewTitle?: boolean
}
