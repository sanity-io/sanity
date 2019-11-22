import {DocumentListBuilder, DocumentListInput, PartialDocumentList} from './DocumentList'
import {Child} from './StructureNodes'
import {DEFAULT_INTENT_HANDLER} from './Intent'
import {GenericListInput} from './GenericList'
import {SchemaType} from './parts/Schema'

export interface DocumentTypeListInput extends Partial<GenericListInput> {
  schemaType: SchemaType | string
}

export class DocumentTypeListBuilder extends DocumentListBuilder {
  protected spec: PartialDocumentList

  constructor(spec?: DocumentListInput) {
    super()
    this.spec = spec ? spec : {}
  }

  child(child: Child) {
    return this.cloneWithoutDefaultIntentHandler({child})
  }

  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder()
    builder.spec = {...this.spec, ...parent.getSpec(), ...(withSpec || {})}
    return builder
  }

  cloneWithoutDefaultIntentHandler(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder()
    const canHandleIntent = this.spec.canHandleIntent
    const shouldOverride = canHandleIntent && canHandleIntent.identity === DEFAULT_INTENT_HANDLER
    const override = shouldOverride ? {canHandleIntent: undefined} : {}
    builder.spec = {
      ...parent.getSpec(),
      ...this.spec,
      ...(withSpec || {}),
      ...override
    }
    return builder
  }
}
