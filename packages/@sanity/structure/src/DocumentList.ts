import {getParameterlessTemplatesBySchemaType, Template} from '@sanity/initial-value-templates'
import {isActionEnabled} from '@sanity/schema/_internal'
import {Schema, SchemaType, SortOrderingItem} from '@sanity/types'
import {SanityClient} from '@sanity/client'
import {SerializeError, HELP_URL} from './SerializeError'
import {SerializeOptions, Child} from './StructureNodes'
import {ChildResolver, ChildResolverContext, ChildResolverOptions, ItemChild} from './ChildResolver'
import {InitialValueTemplateItem} from './InitialValueTemplateItem'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput,
} from './GenericList'
import {DocumentBuilder, getDefaultDocumentNode} from './Document'

const resolveTypeForDocument = async (
  client: SanityClient,
  id: string
): Promise<string | undefined> => {
  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = id.replace(/^drafts\./, '')
  const draftId = `drafts.${documentId}`

  const types = await client.fetch(query, {documentId, draftId}, {tag: 'structure.resolve-type'})

  return types[0]
}

const validateFilter = (spec: PartialDocumentList, options: SerializeOptions) => {
  const filter = spec.options?.filter.trim() || ''

  if (['*', '{'].includes(filter[0])) {
    throw new SerializeError(
      `\`filter\` cannot start with \`${filter[0]}\` - looks like you are providing a query, not a filter`,
      options.path,
      spec.id,
      spec.title
    ).withHelpUrl(HELP_URL.QUERY_PROVIDED_FOR_FILTER)
  }

  return filter
}

const resolveDocumentChildForItem: ChildResolver = (
  context: ChildResolverContext,
  itemId: string,
  options: ChildResolverOptions
): ItemChild | Promise<ItemChild> | undefined => {
  const parent = options.parent as DocumentList
  const type = parent.schemaTypeName || resolveTypeForDocument(context.client, itemId)
  return Promise.resolve(type).then((schemaType) =>
    schemaType
      ? getDefaultDocumentNode(context, {
          schemaType,
          source: parent.source,
          documentId: itemId,
        })
      : new DocumentBuilder().id('editor').documentId(itemId).schemaType('').source(parent.source)
  )
}

export interface PartialDocumentList extends BuildableGenericList {
  options?: DocumentListOptions
  schemaTypeName?: string
  source?: string
}

export interface DocumentListInput extends GenericListInput {
  options: DocumentListOptions
}

export interface DocumentList extends GenericList {
  options: DocumentListOptions
  child: Child
  schemaTypeName?: string
  source?: string
}

interface DocumentListOptions {
  filter: string
  params?: {[key: string]: any}
  apiVersion?: string
  defaultOrdering?: SortOrderingItem[]
}

export class DocumentListBuilder extends GenericListBuilder<
  PartialDocumentList,
  DocumentListBuilder
> {
  protected spec: PartialDocumentList
  protected schema: Schema
  protected templates: Template[]

  constructor(schema: Schema, templates: Template[], spec?: DocumentListInput) {
    super()
    this.schema = schema
    this.templates = templates
    this.spec = spec ? spec : {}
    this.initialValueTemplatesSpecified = Boolean(spec && spec.initialValueTemplates)
  }

  apiVersion(apiVersion: string): DocumentListBuilder {
    return this.clone({options: {...(this.spec.options || {filter: ''}), apiVersion}})
  }

  getApiVersion(): string | undefined {
    return this.spec.options?.apiVersion
  }

  filter(filter: string): DocumentListBuilder {
    return this.clone({options: {...(this.spec.options || {}), filter}})
  }

  getFilter(): string | undefined {
    return this.spec.options?.filter
  }

  schemaType(type: SchemaType | string): DocumentListBuilder {
    const schemaTypeName = typeof type === 'string' ? type : type.name
    return this.clone({schemaTypeName})
  }

  source(source: string): DocumentListBuilder {
    return this.clone({source})
  }

  getSchemaType(): string | undefined {
    return this.spec.schemaTypeName
  }

  params(params: Record<string, unknown>): DocumentListBuilder {
    return this.clone({
      options: {...(this.spec.options || {filter: ''}), params},
    })
  }

  getParams(): Record<string, unknown> | undefined {
    return this.spec.options?.params
  }

  defaultOrdering(ordering: SortOrderingItem[]): DocumentListBuilder {
    if (!Array.isArray(ordering)) {
      throw new Error('`defaultOrdering` must be an array of order clauses')
    }

    return this.clone({
      options: {...(this.spec.options || {filter: ''}), defaultOrdering: ordering},
    })
  }

  getDefaultOrdering(): SortOrderingItem[] | undefined {
    return this.spec.options?.defaultOrdering
  }

  serialize(options: SerializeOptions = {path: []}): DocumentList {
    if (typeof this.spec.id !== 'string' || !this.spec.id) {
      throw new SerializeError(
        '`id` is required for document lists',
        options.path,
        options.index,
        this.spec.title
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!this.spec.options || !this.spec.options.filter) {
      throw new SerializeError(
        '`filter` is required for document lists',
        options.path,
        this.spec.id,
        this.spec.title
      ).withHelpUrl(HELP_URL.FILTER_REQUIRED)
    }

    return {
      ...super.serialize(options),
      type: 'documentList',
      schemaTypeName: this.spec.schemaTypeName,
      child: this.spec.child || resolveDocumentChildForItem,
      options: {
        ...this.spec.options,
        apiVersion:
          this.spec.options.apiVersion ||
          // If this is a simple type filter, use modern API version - otherwise default to v1
          (this.spec.options?.filter === '_type == $type' ? '2021-06-07' : '1'),
        filter: validateFilter(this.spec, options),
      },
      source: this.spec.source || options.source,
    }
  }

  clone(withSpec?: PartialDocumentList): DocumentListBuilder {
    const builder = new DocumentListBuilder(this.schema, this.templates)
    builder.spec = {...this.spec, ...(withSpec || {})}

    if (!this.initialValueTemplatesSpecified) {
      builder.spec.initialValueTemplates = inferInitialValueTemplates(
        this.schema,
        this.templates,
        builder.spec
      )
    }

    if (!builder.spec.schemaTypeName) {
      builder.spec.schemaTypeName = inferTypeName(builder.spec)
    }

    return builder
  }

  getSpec(): PartialDocumentList {
    return this.spec
  }
}

function inferInitialValueTemplates(
  schema: Schema,
  templates: Template[],
  spec: PartialDocumentList
): InitialValueTemplateItem[] | undefined {
  const {schemaTypeName, options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = schemaTypeName ? [schemaTypeName] : getTypeNamesFromFilter(filter, params)

  if (typeNames.length === 0) {
    return undefined
  }

  const templateItems: InitialValueTemplateItem[] = []
  return typeNames.reduce((items, typeName) => {
    const schemaType = schema.get(typeName)

    if (!schemaType) {
      // @todo
      // throw new Error(`no schema type: "${typeName}"`)

      return items
    }

    if (!isActionEnabled(schemaType, 'create')) {
      return items
    }

    return items.concat(
      getParameterlessTemplatesBySchemaType(schema, templates, typeName).map(
        (tpl): InitialValueTemplateItem => ({
          type: 'initialValueTemplateItem',
          id: tpl.id,
          templateId: tpl.id,
        })
      )
    )
  }, templateItems)
}

function inferTypeName(spec: PartialDocumentList): string | undefined {
  const {options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = getTypeNamesFromFilter(filter, params)
  return typeNames.length === 1 ? typeNames[0] : undefined
}

export function getTypeNamesFromFilter(
  filter: string,
  params: {[key: string]: any} = {}
): string[] {
  let typeNames = getTypeNamesFromEqualityFilter(filter, params)

  if (typeNames.length === 0) {
    typeNames = getTypeNamesFromInTypesFilter(filter, params)
  }

  return typeNames
}

// From _type == "movie" || _type == $otherType
function getTypeNamesFromEqualityFilter(
  filter: string,
  params: {[key: string]: any} = {}
): string[] {
  const pattern =
    /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type/g
  const matches: string[] = []
  let match
  while ((match = pattern.exec(filter)) !== null) {
    matches.push(match[1] || match[2])
  }

  return matches
    .map((candidate) => {
      const typeName = candidate[0] === '$' ? params[candidate.slice(1)] : candidate
      const normalized = (typeName || '').trim().replace(/^["']|["']$/g, '')
      return normalized
    })
    .filter(Boolean)
}

// From _type in ["dog", "cat", $otherSpecies]
function getTypeNamesFromInTypesFilter(
  filter: string,
  params: {[key: string]: any} = {}
): string[] {
  const pattern = /\b_type\s+in\s+\[(.*?)\]/
  const matches = filter.match(pattern)
  if (!matches) {
    return []
  }

  return matches[1]
    .split(/,\s*/)
    .map((match) => match.trim().replace(/^["']+|["']+$/g, ''))
    .map((item) => (item[0] === '$' ? params[item.slice(1)] : item))
    .filter(Boolean)
}
