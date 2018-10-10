import {camelCase} from 'lodash'
import {EditorNode, SerializeOptions, Serializable} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {SchemaType} from './parts/Schema'

export type PartialEditorNode = {
  id?: string
  title?: string
  options?: {
    id?: string
    type?: string
  }
}

export class EditorBuilder implements Serializable {
  protected spec: PartialEditorNode

  constructor(spec?: EditorNode) {
    this.spec = spec ? spec : {}
  }

  id(id: string): EditorBuilder {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  title(title: string) {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle() {
    return this.spec.title
  }

  documentId(documentId: string): EditorBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        id: documentId
      }
    })
  }

  getDocumentId() {
    return this.spec.options && this.spec.options.id
  }

  schemaType(documentType: SchemaType | string): EditorBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        type: typeof documentType === 'string' ? documentType : documentType.name
      }
    })
  }

  getSchemaType() {
    return this.spec.options && this.spec.options.type
  }

  serialize({path, index, hint}: SerializeOptions = {path: []}): EditorNode {
    const {id, options} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError('`id` is required for editor nodes', path, index, hint).withHelpUrl(
        HELP_URL.ID_REQUIRED
      )
    }

    if (!options || !options.id) {
      throw new SerializeError(
        'document id (`id`) is required for editor nodes',
        path,
        id,
        hint
      ).withHelpUrl(HELP_URL.DOCUMENT_ID_REQUIRED)
    }

    return {
      ...this.spec,
      id,
      type: 'document',
      options: {id: options.id, type: options.type}
    }
  }

  clone(withSpec: PartialEditorNode = {}) {
    const builder = new EditorBuilder()
    const options = {...(this.spec.options || {}), ...(withSpec.options || {})}
    builder.spec = {...this.spec, ...withSpec, options}
    return builder
  }
}
