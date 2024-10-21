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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentOptions extends BaseSchemaTypeOptions {}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentRule extends RuleDef<DocumentRule, SanityDocument> {}

/** @public */
export interface DocumentDefinition extends Omit<ObjectDefinition, 'type'> {
  type: 'document'
  liveEdit?: boolean
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
