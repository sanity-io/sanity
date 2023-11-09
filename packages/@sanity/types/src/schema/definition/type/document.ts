import type {SanityDocument} from '../../../documents/types'
import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty, SortOrdering} from '../../types'
import type {ObjectDefinition} from './object'

/**
 * This exists only to allow for extensions using declaration-merging.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentOptions {}

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
  /** @alpha */
  __experimental_search?: {path: string; weight: number; mapWith?: string}[]
  /** @alpha */
  __experimental_omnisearch_visibility?: boolean
}
