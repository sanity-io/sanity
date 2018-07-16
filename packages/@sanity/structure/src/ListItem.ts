import {SerializeOptions, Serializable, Collection, CollectionBuilder} from './StructureNodes'
import {ChildResolver} from './ChildResolver'
import {Partial} from './Partial'
import {DocumentListBuilder} from './DocumentList'
import {ListBuilder} from './List'
import {Ordering} from './Sort'
import {EditorBuilder} from './Editor'
import {SerializeError, HELP_URL} from './SerializeError'

export interface SchemaType {
  name: string
  type?: SchemaType
  orderings?: Ordering[]
}

type UnserializedListItemChild = Collection | CollectionBuilder | ChildResolver

type ListItemChild = Collection | ChildResolver | undefined

export interface ListItem {
  id: string
  title: string
  child?: ListItemChild
  schemaType?: SchemaType
}

export interface UnserializedListItem {
  id: string
  title: string
  child?: UnserializedListItemChild
  schemaType?: SchemaType
}

type PartialListItem = Partial<UnserializedListItem>

export class ListItemBuilder implements Serializable {
  protected spec: PartialListItem

  constructor(spec?: ListItem) {
    this.spec = spec ? spec : {}
  }

  id(id: string): ListItemBuilder {
    this.spec.id = id
    return this
  }

  title(title: string): ListItemBuilder {
    this.spec.title = title
    return this
  }

  child(child: UnserializedListItemChild): ListItemBuilder {
    this.spec.child = child
    return this
  }

  schemaType(type: SchemaType): ListItemBuilder {
    this.spec.schemaType = type
    return this
  }

  serialize(options: SerializeOptions = {path: []}): ListItem {
    const {id, title, child} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for list items',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (typeof title !== 'string' || !title) {
      throw new SerializeError('`title` is required for list items', options.path, id).withHelpUrl(
        HELP_URL.TITLE_REQUIRED
      )
    }

    const listChild =
      child instanceof DocumentListBuilder ||
      child instanceof ListBuilder ||
      child instanceof EditorBuilder
        ? child.serialize({path: options.path.concat(id), hint: 'child'})
        : child

    return {...this.spec, child: listChild, id, title}
  }
}
