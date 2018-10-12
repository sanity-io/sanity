import {DocumentListBuilder, DocumentListInput, PartialDocumentList} from './DocumentList'
import {SchemaType} from './parts/Schema'
import {Child} from './StructureNodes'
import {DEFAULT_INTENT_HANDLER} from './documentTypeListItems'

// 1:1 with document list builder, but when modifying key parameters (filter, params, child)
// remove canHandleIntent function since we can't guarantee child editor can handle intent
export class DocumentTypeListBuilder extends DocumentListBuilder {
  protected spec: PartialDocumentList

  constructor(spec?: DocumentListInput) {
    super()
    this.spec = spec ? spec : {}
  }

  filter(filter: string): DocumentListBuilder {
    return this.cloneWithoutDefaultIntentHandler({
      options: {...(this.spec.options || {}), filter}
    })
  }

  params(params: {}): DocumentListBuilder {
    return this.cloneWithoutDefaultIntentHandler({
      options: {...(this.spec.options || {filter: ''}), params}
    })
  }

  schemaType(type: SchemaType | string): DocumentListBuilder {
    return this.cloneWithoutDefaultIntentHandler({
      schemaTypeName: typeof type === 'string' ? type : type.name
    })
  }

  child(child: Child) {
    return this.cloneWithoutDefaultIntentHandler({child})
  }

  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const builder = new DocumentTypeListBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }

  cloneWithoutDefaultIntentHandler(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const builder = new DocumentTypeListBuilder()
    const canHandleIntent = this.spec.canHandleIntent
    const shouldOverride = canHandleIntent && canHandleIntent.identity === DEFAULT_INTENT_HANDLER
    const override = shouldOverride ? {canHandleIntent: undefined} : {}
    builder.spec = {...this.spec, ...(withSpec || {}), ...override}
    return builder
  }
}
