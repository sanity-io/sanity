import {EditorNode} from './StructureNodes'

export type PartialEditorNode = {
  id?: string
  title?: string
  options?: {
    id?: string
    type?: string
  }
}

export class EditorBuilder {
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

  serialize(): EditorNode {
    const {id, options} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new Error('`id` is required for editor nodes')
    }

    if (!options || !options.id) {
      throw new Error('document id (`id`) is required for editor nodes')
    }

    if (!options || !options.type) {
      throw new Error('document type (`type`) is required for editor nodes')
    }

    return {
      ...this.spec,
      id,
      type: 'document',
      options: {id: options.id, type: options.type}
    }
  }
}
