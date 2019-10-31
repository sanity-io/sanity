import {SerializeOptions, Serializable, Child, DocumentNode} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {SchemaType} from './parts/Schema'
import {validateId} from './util/validateId'
import {View, ViewBuilder, maybeSerializeView} from './views/View'

interface DocumentOptions {
  id: string
  type: string
  template?: string
  templateParameters?: {
    [key: string]: any
  }
}

export type PartialDocumentNode = {
  id?: string
  child?: Child
  views?: (View | ViewBuilder)[]
  options?: Partial<DocumentOptions>
}

export class DocumentBuilder implements Serializable {
  protected spec: PartialDocumentNode

  constructor(spec?: PartialDocumentNode) {
    this.spec = spec ? spec : {}
  }

  id(id: string): DocumentBuilder {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  child(child: Child) {
    return this.clone({child})
  }

  getChild() {
    return this.spec.child
  }

  documentId(documentId: string): DocumentBuilder {
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

  schemaType(documentType: SchemaType | string): DocumentBuilder {
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

  views(views: (View | ViewBuilder)[]) {
    return this.clone({views})
  }

  getViews(): (View | ViewBuilder)[] {
    return this.spec.views || []
  }

  serialize({path = [], index, hint}: SerializeOptions = {path: []}): DocumentNode {
    const urlId = path[index || path.length - 1]

    // Try to grab document ID / editor ID from URL if not defined
    const id = this.spec.id || (urlId && `${urlId}`) || ''
    const options: Partial<DocumentOptions> = {
      id,
      type: undefined,
      template: undefined,
      templateParameters: undefined,
      ...this.spec.options
    }

    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for document nodes',
        path,
        index,
        hint
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!options || !options.id) {
      throw new SerializeError(
        'document id (`id`) is required for document nodes',
        path,
        id,
        hint
      ).withHelpUrl(HELP_URL.DOCUMENT_ID_REQUIRED)
    }

    const views = (this.spec.views || []).map((item, i) => maybeSerializeView(item, i, path))

    return {
      ...this.spec,
      child: this.spec.child,
      id: validateId(id, path, index),
      type: 'document',
      options: getDocumentOptions(options),
      views
    }
  }

  clone(withSpec: PartialDocumentNode = {}) {
    const builder = new DocumentBuilder()
    const options = {...(this.spec.options || {}), ...(withSpec.options || {})}
    builder.spec = {...this.spec, ...withSpec, options}
    return builder
  }
}

function getDocumentOptions(spec: Partial<DocumentOptions>): DocumentOptions {
  const opts: DocumentOptions = {
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
