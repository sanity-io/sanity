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
 * Configuration that marks a document schema type as a singleton.
 *
 * Singleton schema types can only represent one document. Studio
 * automatically excludes them from "new document" UI surfaces and from the
 * default Structure Tool content list.
 *
 * @public
 */
export interface DocumentSingletonDefinition {
  /**
   * The document id this singleton schema type represents.
   */
  documentId: string
}

/** @public */
export interface DocumentDefinition extends Omit<ObjectDefinition, 'type'> {
  type: 'document'
  liveEdit?: boolean
  /**
   * Control whether this schema type is a singleton.
   *
   * - Singleton schema types can only represent one document.
   * - Singleton schema types are excluded from document lists.
   *
   * Use the `S.document().singleton()`, `S.listItem().singleton()`, or
   * `S.list().singletons()` Structure Tool helpers to surface a singleton
   * within Structure Tool.
   */
  singleton?: DocumentSingletonDefinition
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
