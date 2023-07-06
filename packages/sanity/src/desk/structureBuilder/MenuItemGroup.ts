import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {StructureContext} from './types'

/** @internal */
export function maybeSerializeMenuItemGroup(
  item: MenuItemGroup | MenuItemGroupBuilder,
  index: number,
  path: SerializePath
): MenuItemGroup {
  return item instanceof MenuItemGroupBuilder ? item.serialize({path, index}) : item
}

/**
 * @hidden
 * @beta */
export interface MenuItemGroup {
  id: string
  title: string
}

/**
 * @hidden
 * @beta */
export class MenuItemGroupBuilder implements Serializable<MenuItemGroup> {
  protected _id: string
  protected _title: string

  constructor(protected _context: StructureContext, spec?: MenuItemGroup) {
    this._id = spec ? spec.id : ''
    this._title = spec ? spec.title : ''
  }

  id(id: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder(this._context, {id, title: this._title})
  }

  getId(): string {
    return this._id
  }

  title(title: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder(this._context, {id: this._id, title})
  }

  getTitle(): string {
    return this._title
  }

  serialize(options: SerializeOptions = {path: []}): MenuItemGroup {
    const {_id, _title} = this
    if (!_id) {
      throw new SerializeError(
        '`id` is required for a menu item group',
        options.path,
        options.index,
        _title
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!_title) {
      throw new SerializeError(
        '`title` is required for a menu item group',
        options.path,
        _id
      ).withHelpUrl(HELP_URL.TITLE_REQUIRED)
    }

    return {
      id: _id,
      title: _title,
    }
  }
}
