export interface MenuItemGroup {
  id: string
  title: string
}

export class MenuItemGroupBuilder {
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

  serialize(): MenuItemGroup {
    const {_id, _title} = this
    if (!_id) {
      throw new Error('`id` is required for a menu item group')
    }

    if (!_title) {
      throw new Error('`title` is required for a menu item group')
    }

    return {
      id: this._id,
      title: this._title
    }
  }
}
