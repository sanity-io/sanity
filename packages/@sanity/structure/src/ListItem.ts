import {SerializeOptions, Serializable, Collection, CollectionBuilder} from './StructureNodes'
import {defaultSchema, SchemaType} from './parts/Schema'
import {ChildResolver} from './ChildResolver'
import {DocumentListBuilder} from './DocumentList'
import {SerializeError, HELP_URL} from './SerializeError'
import {Partial} from './Partial'
import {ListBuilder} from './List'
import {EditorBuilder} from './Editor'
import {ComponentBuilder} from './Component'

type UnserializedListItemChild = Collection | CollectionBuilder | ChildResolver

type ListItemChild = Collection | ChildResolver | undefined

interface ListItemSerializeOptions extends SerializeOptions {
  titleIsOptional?: boolean
}

export interface ListItemInput {
  id: string
  title?: string
  child?: ListItemChild
  schemaType?: SchemaType | string
}

export interface ListItem {
  id: string
  title?: string
  child?: ListItemChild
  schemaType?: SchemaType
}

export interface UnserializedListItem {
  id: string
  title: string
  child?: UnserializedListItemChild
  schemaType?: SchemaType | string
}

type PartialListItem = Partial<UnserializedListItem>

export class ListItemBuilder implements Serializable {
  protected spec: PartialListItem

  constructor(spec?: ListItemInput) {
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

  schemaType(type: SchemaType | string): ListItemBuilder {
    this.spec.schemaType = type
    return this
  }

  serialize(options: ListItemSerializeOptions = {path: []}): ListItem {
    const {id, title, child} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for list items',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!options.titleIsOptional && (typeof title !== 'string' || !title)) {
      throw new SerializeError('`title` is required for list items', options.path, id).withHelpUrl(
        HELP_URL.TITLE_REQUIRED
      )
    }

    let schemaType = this.spec.schemaType
    if (typeof schemaType === 'string') {
      const type: SchemaType = defaultSchema.get(schemaType)
      if (!type) {
        throw new SerializeError(
          `Could not find type "${schemaType}" in schema`,
          options.path,
          id
        ).withHelpUrl(HELP_URL.SCHEMA_TYPE_NOT_FOUND)
      }

      schemaType = type
    }

    const listChild =
      child instanceof ComponentBuilder ||
      child instanceof DocumentListBuilder ||
      child instanceof ListBuilder ||
      child instanceof EditorBuilder
        ? child.serialize({path: options.path.concat(id), hint: 'child'})
        : child

    return {...this.spec, schemaType, child: listChild, id, title}
  }
}
