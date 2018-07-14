import {StructureNode, EditorNode} from './StructureNodes'
import {GenericListBuilder, PartialGenericList, GenericList} from './GenericList'
import {ChildResolver, ChildResolverOptions} from './ChildResolver'
import {SortItem} from './Sort'

const resolveChildForItem: ChildResolver = (
  itemId: string,
  parent: StructureNode,
  options: ChildResolverOptions
): StructureNode | EditorNode | Promise<StructureNode | EditorNode> | undefined => {
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

export interface PartialDocumentList extends PartialGenericList {
  options?: DocumentListOptions
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
  constructor(spec: PartialDocumentList = {}) {
    super(spec)
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

  serialize(): DocumentList {
    if (typeof this.spec.id !== 'string' || !this.spec.id) {
      throw new Error('`id` is required for document lists')
    }

    if (!this.spec.options || !this.spec.options.filter) {
      throw new Error('`filter` is required for document lists')
    }

    return {
      ...super.serialize(),
      type: 'documentList',
      resolveChildForItem: this.spec.resolveChildForItem || resolveChildForItem,
      options: this.spec.options
    }
  }
}
