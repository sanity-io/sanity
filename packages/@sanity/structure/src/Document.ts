import {uniq, camelCase} from 'lodash'
import {SerializeOptions, Serializable, Child, DocumentNode, EditorNode} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {SchemaType} from './parts/Schema'
import {validateId} from './util/validateId'
import {View, ViewBuilder, maybeSerializeView} from './views/View'
import {form} from './views'
import {
  getUserDefinedDefaultDocumentBuilder,
  DocumentFragmentResolveOptions
} from './userDefinedStructure'
import {getTemplateById} from '@sanity/initial-value-templates'

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
  title?: string
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

  title(title: string) {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle() {
    return this.spec.title
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

    const views = (this.spec.views && this.spec.views.length > 0 ? this.spec.views : [form()]).map(
      (item, i) => maybeSerializeView(item, i, path)
    )

    const viewIds = views.map(view => view.id)
    const dupes = uniq(viewIds.filter((id, i) => viewIds.includes(id, i + 1)))
    if (dupes.length > 0) {
      throw new SerializeError(
        `document node has views with duplicate IDs: ${dupes.join(',  ')}`,
        path,
        id,
        hint
      )
    }

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

export function documentFromEditor(spec?: EditorNode) {
  let doc =
    spec && spec.type
      ? // Use user-defined document fragment as base if possible
        getDefaultDocumentNode({schemaType: spec.type})
      : // Fall back to plain old document builder
        new DocumentBuilder()

  if (spec) {
    const {id, type, template, templateParameters} = spec.options

    doc = doc.id(spec.id).documentId(id)

    if (type) {
      doc = doc.schemaType(type)
    }

    if (template) {
      doc = doc.initialValueTemplate(template, templateParameters)
    }

    if (spec.child) {
      doc = doc.child(spec.child)
    }
  }

  return doc
}

export function documentFromEditorWithInitialValue(
  templateId: string,
  parameters?: {[key: string]: any}
) {
  const template = getTemplateById(templateId)
  if (!template) {
    throw new Error(`Template with ID "${templateId}" not defined`)
  }

  return getDefaultDocumentNode({schemaType: template.schemaType}).initialValueTemplate(
    templateId,
    parameters
  )
}

export function getDefaultDocumentNode(
  options: DocumentFragmentResolveOptions
): DocumentBuilder {
  const {documentId, schemaType} = options
  const userDefined = getUserDefinedDefaultDocumentBuilder(options)

  let builder = userDefined || new DocumentBuilder()
  if (!builder.getId()) {
    builder = builder.id('documentEditor')
  }

  if (documentId) {
    builder = builder.documentId(documentId.replace(/^drafts\./, ''))
  }

  return builder.schemaType(schemaType)
}
