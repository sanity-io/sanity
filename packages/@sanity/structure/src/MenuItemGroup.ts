import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'

export function maybeSerializeMenuItemGroup(
  item: MenuItemGroup | MenuItemGroupBuilder,
  index: number,
  path: SerializePath
): MenuItemGroup {
  return item instanceof MenuItemGroupBuilder ? item.serialize({path, index}) : item
}

export interface MenuItemGroup {
  id: string
  title: string
}

export class MenuItemGroupBuilder implements Serializable {
  protected _id: string
  protected _title: string

  constructor(spec?: MenuItemGroup) {
    this._id = spec ? spec.id : ''
    this._title = spec ? spec.title : ''
  }

  id(id: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder({id, title: this._title})
  }

  getId() {
    return this._id
  }

  title(title: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder({id: this._id, title})
  }

  getTitle() {
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
