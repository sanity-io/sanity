import {getSerializedChildResolver} from './util/getSerializedChildResolver'
import {client} from './parts/Client'
import {SortItem} from './Sort'
import {EditorBuilder} from './Editor'
import {SerializeError, HELP_URL} from './SerializeError'
import {SerializeOptions, Collection} from './StructureNodes'
import {ChildResolver, ChildResolverOptions, ItemChild} from './ChildResolver'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput
} from './GenericList'

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
      `\`filter\` cannot start with \`${
        filter[0]
      }\` - looks like you are providing a query, not a filter`,
      options.path,
      spec.id,
      spec.title
    ).withHelpUrl(HELP_URL.QUERY_PROVIDED_FOR_FILTER)
  }

  return filter
}

const resolveEditorChildForItem: ChildResolver = (
  itemId: string,
  parent: Collection,
  options: ChildResolverOptions
): ItemChild | Promise<ItemChild> | undefined => {
  const parentItem = parent as DocumentList
  return Promise.resolve(parentItem.schemaTypeName || resolveTypeForDocument(itemId)).then(type =>
    new EditorBuilder()
      .id('editor')
      .documentId(itemId)
      .type(type || '')
  )
}

interface PartialDocumentList extends BuildableGenericList {
  options?: DocumentListOptions
  schemaTypeName?: string
}

export interface DocumentListInput extends GenericListInput {
  options: DocumentListOptions
}

export interface DocumentList extends GenericList {
  options: DocumentListOptions
  resolveChildForItem: ChildResolver
  schemaTypeName?: string
}

interface DocumentListOptions {
  filter: string
  params?: {[key: string]: any}
  defaultOrdering?: SortItem[]
}

export class DocumentListBuilder extends GenericListBuilder<PartialDocumentList> {
  protected spec: PartialDocumentList

  constructor(spec?: DocumentListInput) {
    super()
    this.spec = spec ? spec : {}
  }

  filter(filter: string): DocumentListBuilder {
    this.spec.options = {...(this.spec.options || {}), filter}
    return this
  }

  schemaTypeName(typeName: string): DocumentListBuilder {
    this.spec.schemaTypeName = typeName
    return this
  }

  params(params: {}): DocumentListBuilder {
    this.spec.options = {...(this.spec.options || {filter: ''}), params}
    return this
  }

  defaultOrdering(ordering: SortItem[]): DocumentListBuilder {
    if (!Array.isArray(ordering)) {
      throw new Error('`defaultOrdering` must be an array of order clauses')
    }

    this.spec.options = {...(this.spec.options || {filter: ''}), defaultOrdering: ordering}
    return this
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
      resolveChildForItem: getSerializedChildResolver(
        this.spec.resolveChildForItem || resolveEditorChildForItem
      ),
      options: {
        ...this.spec.options,
        filter: validateFilter(this.spec, options)
      }
    }
  }
}
