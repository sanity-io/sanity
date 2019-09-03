import {camelCase} from 'lodash'
import {EditorNode, SerializeOptions, Serializable, StructureNode} from './StructureNodes'
import {getTemplateById} from '@sanity/initial-value-templates'
import {SerializeError, HELP_URL} from './SerializeError'
import {SchemaType} from './parts/Schema'
import {InitialValueTemplateItem, InitialValueTemplateItemBuilder} from './InitialValueTemplateItem'

export type PartialEditorNode = {
  id?: string
  title?: string
  options?: {
    id?: string
    type?: string
    template?: string
  }
  parameters?: {
    [key: string]: any
  }
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
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
    // Let's try to be a bit helpful and assign an ID from document ID if none is specified
    const paneId = this.spec.id || documentId
    return this.clone({
      id: paneId,
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

  initialValueTemplates(templates: InitialValueTemplateItem[]) {
    return this.clone({
      options: {
        ...(this.spec.options || {})
      },
      initialValueTemplates: templates
    })
  }

  getInitialValueTemplates() {
    return this.spec.initialValueTemplates
  }

  serialize({path = [], index, hint}: SerializeOptions = {path: []}): EditorNode {
    const urlId = path[index || path.length - 1]
    const {initialValueTemplates} = this.spec

    // Try to grab document ID / editor ID from URL if not defined
    const id = this.spec.id || (urlId && `${urlId}`)
    const options = {id, type: undefined, template: undefined, ...this.spec.options}

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
      options: {id: options.id, type: options.type, template: options.template},
      initialValueTemplates:
        initialValueTemplates &&
        initialValueTemplates.map(item => (isBuilder(item) ? item.serialize() : item))
    }
  }

  clone(withSpec: PartialEditorNode = {}) {
    const builder = new EditorBuilder()
    const options = {...(this.spec.options || {}), ...(withSpec.options || {})}
    builder.spec = {...this.spec, ...withSpec, options}
    return builder
  }
}

function isBuilder(item: Serializable | StructureNode): item is Serializable {
  return typeof (item as Serializable).serialize === 'function'
}

export function editorWithInitialValueTemplate(
  templateId: string,
  parameters?: {[key: string]: any}
) {
  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error(`Template with ID "${templateId}" not defined`)
  }

  return new EditorBuilder()
    .schemaType(template.schemaType)
    .initialValueTemplates([
      {id: templateId, templateId, parameters, type: 'initialValueTemplateItem'}
    ])
}
