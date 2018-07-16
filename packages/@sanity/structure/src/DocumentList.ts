import {SerializeOptions, Collection} from './StructureNodes'
import {
  GenericListBuilder,
  BuildableGenericList,
  GenericList,
  GenericListInput
} from './GenericList'
import {ChildResolver, ChildResolverOptions, ItemChild} from './ChildResolver'
import {SortItem} from './Sort'
import {SerializeError, HELP_URL} from './SerializeError'

const resolveChildForItem: ChildResolver = (
  itemId: string,
  parent: Collection,
  options: ChildResolverOptions
): ItemChild | Promise<ItemChild> | undefined => {
  const parentItem = parent as DocumentList
  return {
    id: 'editor',
    type: 'document',
    options: {
      id: itemId,
      // @todo this aint always right
      type: parentItem.options.params && parentItem.options.params.type
    }
  }
}

interface PartialDocumentList extends BuildableGenericList {
  options?: DocumentListOptions
}

export interface DocumentListInput extends GenericListInput {
  options: DocumentListOptions
}

export interface DocumentList extends GenericList {
  options: DocumentListOptions
  resolveChildForItem: ChildResolver
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
      resolveChildForItem: this.spec.resolveChildForItem || resolveChildForItem,
      options: this.spec.options
    }
  }
}
