import {camelCase} from 'lodash'
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
  icon?: Function | false
  child?: ListItemChild
  schemaType?: SchemaType | string
}

export interface ListItem {
  id: string
  type: string
  title?: string
  icon?: Function | false
  child?: ListItemChild
  schemaType?: SchemaType
}

export interface UnserializedListItem {
  id: string
  title: string
  icon?: Function | false
  child?: UnserializedListItemChild
  schemaType?: SchemaType | string
}

type PartialListItem = Partial<UnserializedListItem>

export class ListItemBuilder implements Serializable {
  protected spec: PartialListItem

  constructor(spec?: ListItemInput) {
    this.spec = spec ? spec : {}
  }

  id(id: string) {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  title(title: string) {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle() {
    return this.spec.title
  }

  icon(icon: Function | false): ListItemBuilder {
    return this.clone({icon})
  }

  getIcon() {
    return this.spec.icon
  }

  child(child: UnserializedListItemChild): ListItemBuilder {
    return this.clone({child})
  }

  getChild() {
    return this.spec.child
  }

  schemaType(schemaType: SchemaType | string): ListItemBuilder {
    return this.clone({schemaType})
  }

  getSchemaType() {
    return this.spec.schemaType
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

    const serializeOptions = {path: options.path.concat(id), hint: 'child'}
    let listChild =
      child instanceof ComponentBuilder ||
      child instanceof DocumentListBuilder ||
      child instanceof ListBuilder ||
      child instanceof EditorBuilder
        ? child.serialize(serializeOptions)
        : child

    // In the case of a function, create a bound version that will pass the correct serialize
    // context, so we may lazily resolve it at some point in the future without losing context
    if (typeof listChild === 'function') {
      const originalChild = listChild
      listChild = (itemId, options) => {
        return originalChild(itemId, {...options, serializeOptions})
      }
    }

    return {...this.spec, schemaType, child: listChild, id, title, type: 'listItem'}
  }

  clone(withSpec?: PartialListItem): ListItemBuilder {
    const builder = new ListItemBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
