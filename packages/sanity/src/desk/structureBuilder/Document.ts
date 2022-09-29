import {uniq, camelCase} from 'lodash'
import {SchemaType} from '@sanity/types'
import {ChildResolver} from './ChildResolver'
import {SerializeOptions, Serializable, Child, DocumentNode, EditorNode} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {validateId} from './util/validateId'
import {ViewBuilder, maybeSerializeView} from './views/View'
import {form} from './views'
import type {StructureContext, View} from './types'

const createDocumentChildResolver =
  ({resolveDocumentNode}: StructureContext): ChildResolver =>
  (itemId, {params, path}) => {
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

    return resolveDocumentNode({documentId: itemId, schemaType: type})
  }

/** @beta */
export interface DocumentOptions {
  id: string
  type: string
  template?: string
  templateParameters?: Record<string, unknown>
}

/** @beta */
export type PartialDocumentNode = {
  id?: string
  title?: string
  child?: Child
  views?: (View | ViewBuilder)[]
  options?: Partial<DocumentOptions>
}

/** @beta */
export class DocumentBuilder implements Serializable<DocumentNode> {
  protected spec: PartialDocumentNode

  constructor(protected _context: StructureContext, spec?: PartialDocumentNode) {
    this.spec = spec ? spec : {}
  }

  id(id: string): DocumentBuilder {
    return this.clone({id})
  }

  getId(): PartialDocumentNode['id'] {
    return this.spec.id
  }

  title(title: string): DocumentBuilder {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle(): PartialDocumentNode['title'] {
    return this.spec.title
  }

  child(child: Child): DocumentBuilder {
    return this.clone({child})
  }

  getChild(): PartialDocumentNode['child'] {
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

  getDocumentId(): Partial<DocumentOptions>['id'] {
    return this.spec.options?.id
  }

  schemaType(documentType: SchemaType | string): DocumentBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        type: typeof documentType === 'string' ? documentType : documentType.name,
      },
    })
  }

  getSchemaType(): Partial<DocumentOptions>['type'] {
    return this.spec.options?.type
  }

  initialValueTemplate(templateId: string, parameters?: Record<string, unknown>): DocumentBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        template: templateId,
        templateParameters: parameters,
      },
    })
  }

  getInitialValueTemplate(): Partial<DocumentOptions>['template'] {
    return this.spec.options?.template
  }

  getInitialValueTemplateParameters(): Partial<DocumentOptions>['templateParameters'] {
    return this.spec.options?.templateParameters
  }

  views(views: (View | ViewBuilder)[]): DocumentBuilder {
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
      throw new SerializeError(
        'document type (`schemaType`) is required for document nodes',
        path,
        id,
        hint
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
      child: this.spec.child || createDocumentChildResolver(this._context),
      id: validateId(id, path, index),
      type: 'document',
      options: getDocumentOptions(options),
      views,
    }
  }

  clone(withSpec: PartialDocumentNode = {}): DocumentBuilder {
    const builder = new DocumentBuilder(this._context)
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

/** @internal */
export function documentFromEditor(context: StructureContext, spec?: EditorNode): DocumentBuilder {
  let doc = spec?.type
    ? // Use user-defined document fragment as base if possible
      context.resolveDocumentNode({schemaType: spec.type})
    : // Fall back to plain old document builder
      new DocumentBuilder(context)

  if (!spec) return doc

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

  return doc
}

/** @internal */
export function documentFromEditorWithInitialValue(
  {resolveDocumentNode, templates}: StructureContext,
  templateId: string,
  parameters?: Record<string, unknown>
): DocumentBuilder {
  const template = templates.find((t) => t.id === templateId)

  if (!template) {
    throw new Error(`Template with ID "${templateId}" not defined`)
  }

  return resolveDocumentNode({schemaType: template.schemaType}).initialValueTemplate(
    templateId,
    parameters
  )
}
