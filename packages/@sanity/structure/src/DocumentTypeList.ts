import {DocumentListBuilder, DocumentListInput, PartialDocumentList} from './DocumentList'
import {SchemaType} from './parts/Schema'
import {Child} from './StructureNodes'

// 1:1 with document list builder, but when modifying key parameters (filter, params, child)
// remove canHandleIntent function since we can't guarantee child editor can handle intent
export class DocumentTypeListBuilder extends DocumentListBuilder {
  protected spec: PartialDocumentList

  constructor(spec?: DocumentListInput) {
    super()
    this.spec = spec ? spec : {}
  }

  filter(filter: string): DocumentListBuilder {
    return this.clone({
      options: {...(this.spec.options || {}), filter},
      canHandleIntent: undefined
    })
  }

  params(params: {}): DocumentListBuilder {
    return this.clone({
      options: {...(this.spec.options || {filter: ''}), params},
      canHandleIntent: undefined
    })
  }

  schemaType(type: SchemaType | string): DocumentListBuilder {
    return this.clone({
      schemaTypeName: typeof type === 'string' ? type : type.name,
      canHandleIntent: undefined
    })
  }

  child(child: Child) {
    return this.clone({child, canHandleIntent: undefined})
  }

  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const builder = new DocumentTypeListBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
