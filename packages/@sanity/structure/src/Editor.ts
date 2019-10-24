import {camelCase} from 'lodash'
import {EditorNode, SerializeOptions, Serializable} from './StructureNodes'
import {getTemplateById} from '@sanity/initial-value-templates'
import {SerializeError, HELP_URL} from './SerializeError'
import {SchemaType} from './parts/Schema'

interface EditorOptions {
  id: string
  type: string
  template?: string
  templateParameters?: {
    [key: string]: any
  }
}

export type PartialEditorNode = {
  id?: string
  title?: string
  options?: Partial<EditorOptions>
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

  initialValueTemplate(templateId: string, parameters?: {[key: string]: any}) {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        template: templateId,
        templateParameters: parameters
      }
    })
  }

  getInitalValueTemplate() {
    return this.spec.options && this.spec.options.template
  }

  getInitialValueTemplateParameters() {
    return this.spec.options && this.spec.options.templateParameters
  }

  serialize({path = [], index, hint}: SerializeOptions = {path: []}): EditorNode {
    const urlId = path[index || path.length - 1]

    // Try to grab document ID / editor ID from URL if not defined
    const id = this.spec.id || (urlId && `${urlId}`) || ''
    const options: Partial<EditorOptions> = {
      id,
      type: undefined,
      template: undefined,
      templateParameters: undefined,
      ...this.spec.options
    }

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
      options: getEditorOptions(options)
    }
  }

  clone(withSpec: PartialEditorNode = {}) {
    const builder = new EditorBuilder()
    const options = {...(this.spec.options || {}), ...(withSpec.options || {})}
    builder.spec = {...this.spec, ...withSpec, options}
    return builder
  }
}

function getEditorOptions(spec: Partial<EditorOptions>): EditorOptions {
  const opts: EditorOptions = {
    id: spec.id || '',
    type: spec.type || '*'
  }

  if (spec.template) {
    opts.template = spec.template
  }

  if (spec.templateParameters) {
    opts.templateParameters = spec.templateParameters
  }

  return opts
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
    .initialValueTemplate(templateId, parameters)
}
