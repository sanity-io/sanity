import {getParameterlessTemplatesBySchemaType} from '@sanity/initial-value-templates'
import {SchemaType, getDefaultSchema} from './parts/Schema'
import {isActionEnabled} from './parts/documentActionUtils'
import {client} from './parts/Client'
import {SortItem} from './Sort'
import {SerializeError, HELP_URL} from './SerializeError'
import {SerializeOptions, Child} from './StructureNodes'
import {ChildResolver, ChildResolverOptions, ItemChild} from './ChildResolver'
import {InitialValueTemplateItem} from './InitialValueTemplateItem'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput
} from './GenericList'
import {DocumentBuilder, getDefaultDocumentNode} from './Document'

const resolveTypeForDocument = (id: string): Promise<string | undefined> => {
  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = id.replace(/^drafts\./, '')
  const draftId = `drafts.${documentId}`
  return client.fetch(query, {documentId, draftId}).then(types => types[0])
}

const validateFilter = (spec: PartialDocumentList, options: SerializeOptions) => {
  const filter = spec.options!.filter.trim()

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
  itemId: string,
  options: ChildResolverOptions
): ItemChild | Promise<ItemChild> | undefined => {
  const parentItem = options.parent as DocumentList
  const schemaType = parentItem.schemaTypeName || resolveTypeForDocument(itemId)
  return Promise.resolve(schemaType).then(schemaType =>
    schemaType
      ? getDefaultDocumentNode({schemaType, documentId: itemId})
      : new DocumentBuilder()
          .id('editor')
          .documentId(itemId)
          .schemaType('')
  )
}

export interface PartialDocumentList extends BuildableGenericList {
  options?: DocumentListOptions
  schemaTypeName?: string
}

export interface DocumentListInput extends GenericListInput {
  options: DocumentListOptions
}

export interface DocumentList extends GenericList {
  options: DocumentListOptions
  child: Child
  schemaTypeName?: string
}

interface DocumentListOptions {
  filter: string
  params?: {[key: string]: any}
  defaultOrdering?: SortItem[]
}

export class DocumentListBuilder extends GenericListBuilder<
  PartialDocumentList,
  DocumentListBuilder
> {
  protected spec: PartialDocumentList

  constructor(spec?: DocumentListInput) {
    super()
    this.spec = spec ? spec : {}
    this.initialValueTemplatesSpecified = Boolean(spec && spec.initialValueTemplates)
  }

  filter(filter: string): DocumentListBuilder {
    return this.clone({options: {...(this.spec.options || {}), filter}})
  }

  getFilter() {
    return this.spec.options && this.spec.options.filter
  }

  schemaType(type: SchemaType | string): DocumentListBuilder {
    const schemaTypeName = typeof type === 'string' ? type : type.name
    return this.clone({schemaTypeName})
  }

  getSchemaType() {
    return this.spec.schemaTypeName
  }

  params(params: {}): DocumentListBuilder {
    return this.clone({
      options: {...(this.spec.options || {filter: ''}), params}
    })
  }

  getParams() {
    return this.spec.options && this.spec.options.params
  }

  defaultOrdering(ordering: SortItem[]): DocumentListBuilder {
    if (!Array.isArray(ordering)) {
      throw new Error('`defaultOrdering` must be an array of order clauses')
    }

    return this.clone({
      options: {...(this.spec.options || {filter: ''}), defaultOrdering: ordering}
    })
  }

  getDefaultOrdering() {
    return this.spec.options && this.spec.options.defaultOrdering
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
        filter: validateFilter(this.spec, options)
      }
    }
  }

  clone(withSpec?: PartialDocumentList): DocumentListBuilder {
    const builder = new DocumentListBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}

    if (!this.initialValueTemplatesSpecified) {
      builder.spec.initialValueTemplates = inferInitialValueTemplates(builder.spec)
    }

    if (!this.spec.schemaTypeName) {
      builder.spec.schemaTypeName = inferTypeName(builder.spec)
    }

    return builder
  }

  getSpec() {
    return this.spec
  }
}

function inferInitialValueTemplates(
  spec: PartialDocumentList
): InitialValueTemplateItem[] | undefined {
  const schema = getDefaultSchema()
  const {schemaTypeName, options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = schemaTypeName ? [schemaTypeName] : getTypeNamesFromFilter(filter, params)

  if (typeNames.length === 0) {
    return undefined
  }

  let templateItems: InitialValueTemplateItem[] = []
  return typeNames.reduce((items, typeName) => {
    const schemaType = schema.get(typeName)
    if (!isActionEnabled(schemaType, 'create')) {
      return items
    }

    return items.concat(
      getParameterlessTemplatesBySchemaType(typeName).map(
        (tpl): InitialValueTemplateItem => ({
          type: 'initialValueTemplateItem',
          id: tpl.id,
          templateId: tpl.id
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
  const pattern = /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type/g
  const matches: string[] = []
  let match
  while ((match = pattern.exec(filter)) !== null) {
    matches.push(match[1] || match[2])
  }

  return matches
    .map(candidate => {
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
    .map(match => match.trim().replace(/^["']+|["']+$/g, ''))
    .map(item => (item[0] === '$' ? params[item.slice(1)] : item))
    .filter(Boolean)
}
