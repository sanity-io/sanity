import {SchemaType} from '@sanity/types'
import {DocumentListBuilder, DocumentListInput, PartialDocumentList} from './DocumentList'
import {Child} from './StructureNodes'
import {DEFAULT_INTENT_HANDLER} from './Intent'
import {GenericListInput} from './GenericList'
import {StructureContext} from './types'

/**
 * Interface for document type list input
 *
 * @public
 */
export interface DocumentTypeListInput extends Partial<GenericListInput> {
  /** Document type list input schema type */
  schemaType: SchemaType | string
}

/**
 * Class for building a document type list
 *
 * @public
 */
export class DocumentTypeListBuilder extends DocumentListBuilder {
  /** Document list options */
  protected spec: PartialDocumentList

  constructor(
    /**
     * Desk structure context
     */
    protected _context: StructureContext,
    spec?: DocumentListInput
  ) {
    super(_context)
    this.spec = spec ? spec : {}
  }

  /**
   * Set Document type list child
   * @returns document type list builder based on child component provided without default intent handler
   */
  child(child: Child): DocumentTypeListBuilder {
    return this.cloneWithoutDefaultIntentHandler({child})
  }

  /** Clone Document type list builder (allows for options overriding)
   * @returns document type list builder
   */
  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder(this._context)
    builder.spec = {...this.spec, ...parent.getSpec(), ...(withSpec || {})}
    return builder
  }

  /** Clone Document type list builder (allows for options overriding) and remove default intent handler
   * @returns document type list builder without default intent handler
   */
  cloneWithoutDefaultIntentHandler(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder(this._context)
    const canHandleIntent = this.spec.canHandleIntent
    const shouldOverride = canHandleIntent && canHandleIntent.identity === DEFAULT_INTENT_HANDLER
    const override = shouldOverride ? {canHandleIntent: undefined} : {}
    builder.spec = {
      ...parent.getSpec(),
      ...this.spec,
      ...(withSpec || {}),
      ...override,
    }
    return builder
  }
}
