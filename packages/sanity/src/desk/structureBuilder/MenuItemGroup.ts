import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {StructureContext} from './types'

/** @internal */
export function maybeSerializeMenuItemGroup(
  item: MenuItemGroup | MenuItemGroupBuilder,
  index: number,
  path: SerializePath,
): MenuItemGroup {
  return item instanceof MenuItemGroupBuilder ? item.serialize({path, index}) : item
}

/**
 * Interface for menu item groups
 * @public
 */
export interface MenuItemGroup {
  /** Menu group Id */
  id: string
  /** Menu group title */
  title: string
}

/**
 * Class for building menu item groups.
 *
 * @public
 */
export class MenuItemGroupBuilder implements Serializable<MenuItemGroup> {
  /** Menu item group ID */
  protected _id: string
  /** Menu item group title */
  protected _title: string

  constructor(
    /**
     * Desk structure context. See {@link StructureContext}
     */
    protected _context: StructureContext,
    spec?: MenuItemGroup,
  ) {
    this._id = spec ? spec.id : ''
    this._title = spec ? spec.title : ''
  }

  /**
   * Set menu item group ID
   * @param id - menu item group ID
   * @returns menu item group builder based on ID provided. See {@link MenuItemGroupBuilder}
   */
  id(id: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder(this._context, {id, title: this._title})
  }

  /**
   * Get menu item group ID
   * @returns menu item group ID
   */
  getId(): string {
    return this._id
  }

  /**
   * Set menu item group title
   * @param title - menu item group title
   * @returns menu item group builder based on title provided. See {@link MenuItemGroupBuilder}
   */
  title(title: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder(this._context, {id: this._id, title})
  }

  /**
   * Get menu item group title
   * @returns menu item group title
   */
  getTitle(): string {
    return this._title
  }

  /**
   * Serialize menu item group builder
   * @param options - serialization options (path). See {@link SerializeOptions}
   * @returns menu item group based on path provided in options. See {@link MenuItemGroup}
   */
  serialize(options: SerializeOptions = {path: []}): MenuItemGroup {
    const {_id, _title} = this
    if (!_id) {
      throw new SerializeError(
        '`id` is required for a menu item group',
        options.path,
        options.index,
        _title,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!_title) {
      throw new SerializeError(
        '`title` is required for a menu item group',
        options.path,
        _id,
      ).withHelpUrl(HELP_URL.TITLE_REQUIRED)
    }

    return {
      id: _id,
      title: _title,
    }
  }
}
