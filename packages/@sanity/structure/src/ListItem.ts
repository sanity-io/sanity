import {StructureNode, EditorNode} from './StructureNodes'
import {ChildResolver} from './ChildResolver'
import {Partial} from './Partial'
import {DocumentListBuilder} from './DocumentList'
import {ListBuilder} from './List'
import {Ordering} from './Sort'

export interface SchemaType {
  name: string
  type?: SchemaType
  orderings?: Ordering[]
}

type ListItemChild = StructureNode | EditorNode | ChildResolver | DocumentListBuilder | ListBuilder

export interface ListItem {
  id: string
  title: string
  child?: StructureNode | EditorNode | ChildResolver
  schemaType?: SchemaType
}

export type PartialListItem = Partial<ListItem>

export class ListItemBuilder {
  protected spec: PartialListItem

  constructor(spec?: PartialListItem) {
    this.spec = spec || {}
  }

  id(id: string): ListItemBuilder {
    this.spec.id = id
    return this
  }

  title(title: string): ListItemBuilder {
    this.spec.title = title
    return this
  }

  child(child: ListItemChild): ListItemBuilder {
    if (child instanceof DocumentListBuilder || child instanceof ListBuilder) {
      this.spec.child = child.serialize()
    } else {
      this.spec.child = child
    }
    return this
  }

  schemaType(type: SchemaType): ListItemBuilder {
    this.spec.schemaType = type
    return this
  }

  serialize(): ListItem {
    const {id, title} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new Error('`id` is required for list items')
    }

    if (typeof title !== 'string' || !title) {
      throw new Error('`title` is required for list items')
    }

    return {...this.spec, id, title}
  }
}
