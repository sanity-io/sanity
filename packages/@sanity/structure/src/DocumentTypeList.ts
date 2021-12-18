import {Schema, SchemaType} from '@sanity/types'
import {Template} from '@sanity/initial-value-templates'
import {DocumentListBuilder, DocumentListInput, PartialDocumentList} from './DocumentList'
import {Child} from './StructureNodes'
import {DEFAULT_INTENT_HANDLER} from './Intent'
import {GenericListInput} from './GenericList'

export interface DocumentTypeListInput extends Partial<GenericListInput> {
  schemaType: SchemaType | string
}

export class DocumentTypeListBuilder extends DocumentListBuilder {
  protected spec: PartialDocumentList

  constructor(schema: Schema, templates: Template[], spec?: DocumentListInput) {
    super(schema, templates)
    this.spec = spec ? spec : {}
  }

  child(child: Child): DocumentTypeListBuilder {
    return this.cloneWithoutDefaultIntentHandler({child})
  }

  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder(this.schema, this.templates)
    builder.spec = {...this.spec, ...parent.getSpec(), ...(withSpec || {})}
    return builder
  }

  cloneWithoutDefaultIntentHandler(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder(this.schema, this.templates)
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
