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
  /** Document type list input schema type. See {@link SchemaType} */
  schemaType: SchemaType | string
}

/**
 * Class for building a document type list
 *
 * @public
 */
export class DocumentTypeListBuilder extends DocumentListBuilder {
  /** Document list options. See {@link PartialDocumentList} */
  protected spec: PartialDocumentList

  constructor(
    /**
     * Desk structure context. See {@link StructureContext}
     */
    protected _context: StructureContext,
    spec?: DocumentListInput
  ) {
    super(_context)
    this.spec = spec ? spec : {}
  }

  /**
   * Set Document type list child
   * @param child - Child component. See {@link Child}
   * @returns document type list builder based on child component provided without default intent handler. See {@link DocumentTypeListBuilder}
   */
  child(child: Child): DocumentTypeListBuilder {
    return this.cloneWithoutDefaultIntentHandler({child})
  }

  /** Clone Document type list builder (allows for options overriding)
   * @param withSpec - Document type list builder options. See {@link PartialDocumentList}
   * @returns document type list builder. See {@link DocumentTypeListBuilder}
   */
  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder(this._context)
    builder.spec = {...this.spec, ...parent.getSpec(), ...(withSpec || {})}
    return builder
  }

  /** Clone Document type list builder (allows for options overriding) and remove default intent handler
   * @param withSpec - Document type list builder options. See {@link PartialDocumentList}
   * @returns document type list builder without default intent handler. See {@link DocumentTypeListBuilder}
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
