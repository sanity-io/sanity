import {uniq} from 'lodash'
import {SchemaType} from '@sanity/types'
import {resolveTypeForDocument} from './util/resolveTypeForDocument'
import {ChildResolver} from './ChildResolver'
import {SerializeOptions, Serializable, Child, DocumentNode, EditorNode} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {validateId} from './util/validateId'
import {ViewBuilder, maybeSerializeView} from './views/View'
import {form} from './views'
import type {StructureContext, View} from './types'
import {getStructureNodeId} from './util/getStructureNodeId'

const createDocumentChildResolver =
  ({resolveDocumentNode, getClient}: StructureContext): ChildResolver =>
  async (itemId, {params, path}) => {
    let type = params.type

    const parentPath = path.slice(0, path.length - 1)
    const currentSegment = path[path.length - 1]

    if (!type) {
      type = await resolveTypeForDocument(getClient, itemId)
    }

    if (!type) {
      throw new SerializeError(
        `Failed to resolve document, and no type provided in parameters.`,
        parentPath,
        currentSegment
      )
    }

    return resolveDocumentNode({documentId: itemId, schemaType: type})
  }

/**
 * Interface for options of Partial Documents
 * {@link PartialDocumentNode}
 *
 * @public */
export interface DocumentOptions {
  /** Document Id */
  id: string
  /** Document Type */
  type: string
  /** Document Template */
  template?: string
  /** Template parameters */
  templateParameters?: Record<string, unknown>
}

/**
 * Type for partial document (focused on the document pane)
 *
 * @public */
export type PartialDocumentNode = {
  /* Document Id */
  id?: string
  /* Document title */
  title?: string
  /* Document children */
  child?: Child
  /**
   * Views for the document pane
   */
  views?: (View | ViewBuilder)[]
  /**
   * Document options
   * {@link DocumentOptions}
   */
  options?: Partial<DocumentOptions>
}

/**
 * A `DocumentBuilder` is used to build a document node.
 *
 * @public */
export class DocumentBuilder implements Serializable<DocumentNode> {
  protected spec: PartialDocumentNode

  constructor(
    /**
     * Desk structure context
     */
    protected _context: StructureContext,
    spec?: PartialDocumentNode
  ) {
    this.spec = spec ? spec : {}
  }

  /** Set Document Builder ID
   * @returns document builder based on ID provided
   */
  id(id: string): DocumentBuilder {
    return this.clone({id})
  }

  /** Get Document Builder ID
   * @returns document ID
   */
  getId(): PartialDocumentNode['id'] {
    return this.spec.id
  }

  /** Set Document title
   * @returns document builder based on title provided (and ID)
   */
  title(title: string): DocumentBuilder {
    return this.clone({title, id: getStructureNodeId(title, this.spec.id)})
  }

  /** Get Document title
   * @returns document title
   */
  getTitle(): PartialDocumentNode['title'] {
    return this.spec.title
  }

  /** Set Document child
   * @returns document builder based on child provided
   */
  child(child: Child): DocumentBuilder {
    return this.clone({child})
  }

  /** Get Document child
   * @returns document child
   */
  getChild(): PartialDocumentNode['child'] {
    return this.spec.child
  }

  /** Set Document ID
   * @returns document builder with document based on ID provided
   */
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

  /** Get Document ID
   * @returns document ID
   */
  getDocumentId(): Partial<DocumentOptions>['id'] {
    return this.spec.options?.id
  }

  /** Set Document Type
   * @returns document builder with document based on type provided
   */
  schemaType(documentType: SchemaType | string): DocumentBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        type: typeof documentType === 'string' ? documentType : documentType.name,
      },
    })
  }

  /** Get Document Type
   * @returns document type
   */
  getSchemaType(): Partial<DocumentOptions>['type'] {
    return this.spec.options?.type
  }

  /** Set Document Template
   * @returns document builder with document based on template provided
   */
  initialValueTemplate(templateId: string, parameters?: Record<string, unknown>): DocumentBuilder {
    return this.clone({
      options: {
        ...(this.spec.options || {}),
        template: templateId,
        templateParameters: parameters,
      },
    })
  }

  /** Get Document Template
   * @returns document template
   */
  getInitialValueTemplate(): Partial<DocumentOptions>['template'] {
    return this.spec.options?.template
  }

  /** Get Document's initial value Template parameters
   * @returns document template parameters
   */
  getInitialValueTemplateParameters(): Partial<DocumentOptions>['templateParameters'] {
    return this.spec.options?.templateParameters
  }

  /** Set Document views
   * @returns document builder with document based on views provided
   */
  views(views: (View | ViewBuilder)[]): DocumentBuilder {
    return this.clone({views})
  }

  /** Get Document views
   * @returns document views
   */
  getViews(): (View | ViewBuilder)[] {
    return this.spec.views || []
  }

  /** Serialize Document builder
   * @returns document node based on path, index and hint provided in options
   */
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

  /** Clone Document builder
   * @returns document builder based on context and spec provided
   */
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
