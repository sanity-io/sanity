// eslint-disable-next-line @typescript-eslint/no-empty-interface
import {SanityDocument} from '../../../documents/types'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty, SortOrdering} from '../../types'
import {ObjectDefinition} from './object'

/** @public */
// this exists only to allow for extensions using declaration-merging.
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
