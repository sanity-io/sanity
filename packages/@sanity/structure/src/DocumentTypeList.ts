import {DocumentListBuilder, DocumentListInput, PartialDocumentList} from './DocumentList'
import {Child} from './StructureNodes'
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
    return this.clone({child})
  }

  clone(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    const parent = super.clone(withSpec)
    const builder = new DocumentTypeListBuilder()
    builder.spec = {...this.spec, ...parent.getSpec(), ...(withSpec || {})}
    return builder
  }

  /**
   * @deprecated
   */
  cloneWithoutDefaultIntentHandler(withSpec?: PartialDocumentList): DocumentTypeListBuilder {
    return this.clone(withSpec)
  }
}
