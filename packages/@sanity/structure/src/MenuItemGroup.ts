import {SerializeOptions, Serializable} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'

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
    this._id = id
    return this
  }

  title(title: string): MenuItemGroupBuilder {
    this._title = title
    return this
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
      title: _title
    }
  }
}
