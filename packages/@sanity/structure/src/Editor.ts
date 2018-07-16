import {EditorNode, SerializeOptions, Serializable} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'

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

  constructor(spec?: PartialEditorNode) {
    this.spec = spec || {}
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

  type(documentType: string): EditorBuilder {
    this.spec.options = {
      ...(this.spec.options || {}),
      type: documentType
    }

    return this
  }

  serialize({path, index, hint}: SerializeOptions): EditorNode {
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
