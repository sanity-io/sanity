import {getTemplateById} from '@sanity/initial-value-templates'
import {SchemaType} from '@sanity/types'
import {uniq, camelCase} from 'lodash'
import {ChildResolver, ChildResolverContext} from './ChildResolver'
import {SerializeOptions, Serializable, Child, DocumentNode, EditorNode} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {validateId} from './util/validateId'
import {View, ViewBuilder, maybeSerializeView} from './views/View'
import {form} from './views'

const resolveDocumentChild: ChildResolver = (context, itemId, {params, path}) => {
  const {type} = params

  const parentPath = path.slice(0, path.length - 1)
  const currentSegment = path[path.length - 1]

  if (!type) {
    throw new SerializeError(
      `Invalid link. Your link must contain a \`type\`.`,
      parentPath,
      currentSegment
    )
  }

  return getDefaultDocumentNode(context, {
    documentId: itemId,
    schemaType: type,
  })
}

interface DocumentOptions {
  id: string
  type: string
  template?: string
  templateParameters?: Record<string, any>
}

export type PartialDocumentNode = {
  id?: string
  title?: string
  child?: Child
  views?: (View | ViewBuilder)[]
  options?: Partial<DocumentOptions>
  source?: string
}

export class DocumentBuilder implements Serializable {
  protected spec: PartialDocumentNode

  constructor(spec?: PartialDocumentNode) {
    this.spec = spec ? spec : {}
  }

  id(id: string): DocumentBuilder {
    return this.clone({id})
  }

  getId(): string | undefined {
    return this.spec.id
  }

  title(title: string): DocumentBuilder {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle(): string | undefined {
    return this.spec.title
  }

  child(child: Child): DocumentBuilder {
    return this.clone({child})
  }

  getChild(): Child | undefined {
    return this.spec.child
  }

  documentId(documentId: string): DocumentBuilder {
    // Let's try to be a bit helpful and assign an ID from document ID if none is specified
    const paneId = this.spec.id || documentId
    return this.clone({
      id: paneId,
      options: {
        ...(this.spec.options || {}),
        id: documentId,
      },
    })
  }

  getDocumentId(): string | undefined {
    return this.spec.options && this.spec.options.id
  }

  schemaType(documentType: SchemaType | string): DocumentBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        type: typeof documentType === 'string' ? documentType : documentType.name,
      },
    })
  }

  getSchemaType(): string | undefined {
    return this.spec.options && this.spec.options.type
  }

  initialValueTemplate(templateId: string, parameters?: Record<string, any>): DocumentBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        template: templateId,
        templateParameters: parameters,
      },
    })
  }

  getInitalValueTemplate(): string | undefined {
    return this.spec.options && this.spec.options.template
  }

  getInitialValueTemplateParameters(): Record<string, any> | undefined {
    return this.spec.options && this.spec.options.templateParameters
  }

  views(views: (View | ViewBuilder)[]): DocumentBuilder {
    return this.clone({views})
  }

  getViews(): (View | ViewBuilder)[] {
    return this.spec.views || []
  }

  source(source?: string): DocumentBuilder {
    return this.clone({source})
  }

  serialize({path = [], index, hint, source}: SerializeOptions = {path: []}): DocumentNode {
    const urlId = path[index || path.length - 1]

    // Try to grab document ID / editor ID from URL if not defined
    const id = this.spec.id || (urlId && `${urlId}`) || ''
    const options: Partial<DocumentOptions> = {
      id,
      type: undefined,
      template: undefined,
      templateParameters: undefined,
      ...this.spec.options,
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

    if (!options || !options.type) {
      // eslint-disable-next-line no-console
      console.log(
        `⚠️ Structure warning: document type (\`schemaType\`) will be required for document nodes in the near future! At:\n\n${path.join(
          ' > '
        )}\n`
      )
    }

    const views = (this.spec.views && this.spec.views.length > 0 ? this.spec.views : [form()]).map(
      (item, i) => maybeSerializeView(item, i, path)
    )

    const viewIds = views.map((view) => view.id)
    const dupes = uniq(viewIds.filter((viewId, i) => viewIds.includes(viewId, i + 1)))
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
      child: this.spec.child || resolveDocumentChild,
      id: validateId(id, path, index),
      type: 'document',
      options: getDocumentOptions(options),
      source: source || this.spec.source,
      views,
    }
  }

  clone(withSpec: PartialDocumentNode = {}): DocumentBuilder {
    const builder = new DocumentBuilder()
    const options = {...(this.spec.options || {}), ...(withSpec.options || {})}
    builder.spec = {...this.spec, ...withSpec, options}
    return builder
  }
}

function getDocumentOptions(spec: Partial<DocumentOptions>): DocumentOptions {
  const opts: DocumentOptions = {
    id: spec.id || '',
    type: spec.type || '*',
  }

  if (spec.template) {
    opts.template = spec.template
  }

  if (spec.templateParameters) {
    opts.templateParameters = spec.templateParameters
  }

  return opts
}

export function documentFromEditor(
  context: ChildResolverContext,
  spec?: EditorNode
): DocumentBuilder {
  let doc =
    spec && spec.type
      ? // Use user-defined document fragment as base if possible
        getDefaultDocumentNode(context, {schemaType: spec.type})
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
  context: ChildResolverContext,
  templateId: string,
  parameters?: Record<string, any>
): DocumentBuilder {
  const template = getTemplateById(context.schema, context.templates, templateId)

  if (!template) {
    throw new Error(`Template with ID "${templateId}" not defined`)
  }

  return getDefaultDocumentNode(context, {
    schemaType: template.schemaType,
  }).initialValueTemplate(templateId, parameters)
}

export function getDefaultDocumentNode(
  context: ChildResolverContext,
  options: {
    documentId?: string
    schemaType: string
    source?: string
  }
): DocumentBuilder {
  const {resolveStructureDocumentNode, structureBuilder: S} = context
  const {documentId, schemaType, source} = options
  const userDefined = resolveStructureDocumentNode && resolveStructureDocumentNode(S, options)

  let builder = userDefined || new DocumentBuilder({source})

  if (!builder.getId()) {
    builder = builder.id('documentEditor')
  }

  if (documentId) {
    builder = builder.documentId(documentId.replace(/^drafts\./, ''))
  }

  return builder.schemaType(schemaType)
}
