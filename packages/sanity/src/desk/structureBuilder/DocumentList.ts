import {SchemaType, SortOrderingItem} from '@sanity/types'
import {ComposeIcon} from '@sanity/icons'
import {resolveTypeForDocument} from './util/resolveTypeForDocument'
import {SerializeError, HELP_URL} from './SerializeError'
import {SerializeOptions, Child} from './StructureNodes'
import {ChildResolver, ChildResolverOptions, ItemChild} from './ChildResolver'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput,
} from './GenericList'
import {DocumentBuilder} from './Document'
import {StructureContext} from './types'
import {InitialValueTemplateItem} from 'sanity'

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

const createDocumentChildResolverForItem =
  (context: StructureContext): ChildResolver =>
  (itemId: string, options: ChildResolverOptions): ItemChild | Promise<ItemChild> | undefined => {
    const parentItem = options.parent as DocumentList
    const template = options.params?.template
      ? context.templates.find((tpl) => tpl.id === options.params.template)
      : undefined
    const type = template
      ? template.schemaType
      : parentItem.schemaTypeName || resolveTypeForDocument(context.getClient, itemId)

    return Promise.resolve(type).then((schemaType) =>
      schemaType
        ? context.resolveDocumentNode({schemaType, documentId: itemId})
        : new DocumentBuilder(context).id('editor').documentId(itemId).schemaType('')
    )
  }

/**
 * @hidden
 * @beta */
export interface PartialDocumentList extends BuildableGenericList {
  options?: DocumentListOptions
  schemaTypeName?: string
}

/**
 * @hidden
 * @beta */
export interface DocumentListInput extends GenericListInput {
  options: DocumentListOptions
}

/**
 * @hidden
 * @beta */
export interface DocumentList extends GenericList {
  type: 'documentList'
  options: DocumentListOptions
  child: Child
  schemaTypeName?: string
}

/**
 * @hidden
 * @beta */
export interface DocumentListOptions {
  filter: string
  params?: Record<string, unknown>
  apiVersion?: string
  defaultOrdering?: SortOrderingItem[]
}

/**
 * @hidden
 * @beta */
export class DocumentListBuilder extends GenericListBuilder<
  PartialDocumentList,
  DocumentListBuilder
> {
  protected spec: PartialDocumentList

  constructor(protected _context: StructureContext, spec?: DocumentListInput) {
    super()
    this.spec = spec || {}
    this.initialValueTemplatesSpecified = Boolean(spec?.initialValueTemplates)
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
      child: this.spec.child || createDocumentChildResolverForItem(this._context),
      options: {
        ...this.spec.options,
        apiVersion:
          this.spec.options.apiVersion ||
          // If this is a simple type filter, use modern API version - otherwise default to v1
          (this.spec.options?.filter === '_type == $type' ? '2021-06-07' : '1'),
        filter: validateFilter(this.spec, options),
      },
    }
  }

  clone(withSpec?: PartialDocumentList): DocumentListBuilder {
    const builder = new DocumentListBuilder(this._context)
    builder.spec = {...this.spec, ...(withSpec || {})}

    if (!this.initialValueTemplatesSpecified) {
      builder.spec.initialValueTemplates = inferInitialValueTemplates(this._context, builder.spec)
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
  context: StructureContext,
  spec: PartialDocumentList
): InitialValueTemplateItem[] | undefined {
  const {document} = context
  const {schemaTypeName, options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = schemaTypeName
    ? [schemaTypeName]
    : Array.from(new Set(getTypeNamesFromFilter(filter, params)))

  if (typeNames.length === 0) {
    return undefined
  }

  return typeNames
    .flatMap((schemaType) =>
      document.resolveNewDocumentOptions({
        type: 'structure',
        schemaType,
      })
    )
    .map((option) => ({...option, icon: ComposeIcon}))
}

function inferTypeName(spec: PartialDocumentList): string | undefined {
  const {options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = getTypeNamesFromFilter(filter, params)
  return typeNames.length === 1 ? typeNames[0] : undefined
}

/** @internal */
export function getTypeNamesFromFilter(
  filter: string,
  params: Record<string, unknown> = {}
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
  params: Record<string, unknown> = {}
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
      const normalized = ((typeName as string) || '').trim().replace(/^["']|["']$/g, '')
      return normalized
    })
    .filter(Boolean)
}

// From _type in ["dog", "cat", $otherSpecies]
function getTypeNamesFromInTypesFilter(
  filter: string,
  params: Record<string, unknown> = {}
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
    .filter(Boolean) as string[]
}
