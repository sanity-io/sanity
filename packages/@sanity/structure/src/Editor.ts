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
    this.spec.id = id
    return this
  }

  title(title: string): EditorBuilder {
    this.spec.title = title
    return this
  }

  documentId(documentId: string): EditorBuilder {
    this.spec.options = {
      ...(this.spec.options || {}),
      id: documentId
    }

    return this
  }

  schemaType(documentType: SchemaType | string): EditorBuilder {
    this.spec.options = {
      ...(this.spec.options || {}),
      type: typeof documentType === 'string' ? documentType : documentType.name
    }

    return this
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

    if (!options || !options.type) {
      throw new SerializeError(
        'document type (`type`) is required for editor nodes',
        path,
        id,
        hint
      ).withHelpUrl(HELP_URL.DOCUMENT_TYPE_REQUIRED)
    }

    return {
      ...this.spec,
      id,
      type: 'document',
      options: {id: options.id, type: options.type}
    }
  }
}
