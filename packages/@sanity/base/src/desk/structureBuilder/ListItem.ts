import {camelCase} from 'lodash'
import {SchemaType} from '@sanity/types'
import {SerializeOptions, Serializable, Collection, CollectionBuilder} from './StructureNodes'
import {ChildResolver} from './ChildResolver'
import {DocumentListBuilder} from './DocumentList'
import {SerializeError, HELP_URL} from './SerializeError'
import {ListBuilder} from './List'
import {DocumentBuilder} from './Document'
import {ComponentBuilder} from './Component'
import {validateId} from './util/validateId'
import {StructureContext} from './types'

export type UnserializedListItemChild = Collection | CollectionBuilder | ChildResolver

export type ListItemChild = Collection | ChildResolver | undefined

export interface ListItemSerializeOptions extends SerializeOptions {
  titleIsOptional?: boolean
}

export interface ListItemDisplayOptions {
  showIcon?: boolean
}

export interface ListItemInput {
  id: string
  title?: string
  icon?: React.ComponentType | React.ReactNode
  child?: ListItemChild
  displayOptions?: ListItemDisplayOptions
  schemaType?: SchemaType | string
}

export interface ListItem {
  id: string
  type: string
  title?: string
  icon?: React.ComponentType | React.ReactNode
  child?: ListItemChild
  displayOptions?: ListItemDisplayOptions
  schemaType?: SchemaType
}

export interface UnserializedListItem {
  id: string
  title: string
  icon?: React.ComponentType | React.ReactNode
  child?: UnserializedListItemChild
  displayOptions?: ListItemDisplayOptions
  schemaType?: SchemaType | string
}

export type PartialListItem = Partial<UnserializedListItem>

export class ListItemBuilder implements Serializable<ListItem> {
  protected spec: PartialListItem

  constructor(protected _context: StructureContext, spec?: ListItemInput) {
    this.spec = spec ? spec : {}
  }

  id(id: string): ListItemBuilder {
    return this.clone({id})
  }

  getId(): PartialListItem['id'] {
    return this.spec.id
  }

  title(title: string): ListItemBuilder {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle(): PartialListItem['title'] {
    return this.spec.title
  }

  icon(icon: React.ComponentType | React.ReactNode): ListItemBuilder {
    return this.clone({icon})
  }

  showIcon(enabled = true): ListItemBuilder {
    return this.clone({
      displayOptions: {...(this.spec.displayOptions || {}), showIcon: enabled},
    })
  }

  getShowIcon(): boolean | undefined {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcon : undefined
  }

  getIcon(): PartialListItem['icon'] {
    return this.spec.icon
  }

  child(child: UnserializedListItemChild): ListItemBuilder {
    return this.clone({child})
  }

  getChild(): PartialListItem['child'] {
    return this.spec.child
  }

  schemaType(schemaType: SchemaType | string): ListItemBuilder {
    return this.clone({schemaType})
  }

  getSchemaType(): PartialListItem['schemaType'] {
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
      const type = this._context.schema.get(schemaType)
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
      child instanceof DocumentBuilder ||
      child instanceof ListBuilder
        ? child.serialize(serializeOptions)
        : child

    // In the case of a function, create a bound version that will pass the correct serialize
    // context, so we may lazily resolve it at some point in the future without losing context
    if (typeof listChild === 'function') {
      const originalChild = listChild
      listChild = (itemId, childOptions) => {
        return originalChild(itemId, {...childOptions, serializeOptions})
      }
    }

    return {
      ...this.spec,
      id: validateId(id, options.path, options.index),
      schemaType,
      child: listChild,
      title,
      type: 'listItem',
    }
  }

  clone(withSpec?: PartialListItem): ListItemBuilder {
    const builder = new ListItemBuilder(this._context)
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
