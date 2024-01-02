import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {StructureContext} from './types'
import {I18nTextRecord} from 'sanity'

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
  i18n?: I18nTextRecord<'title'>
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

  protected _i18n?: I18nTextRecord<'title'>

  constructor(
    /**
     * Desk structure context. See {@link StructureContext}
     */
    protected _context: StructureContext,
    spec?: MenuItemGroup,
  ) {
    this._id = spec ? spec.id : ''
    this._title = spec ? spec.title : ''
    this._i18n = spec ? spec.i18n : undefined
  }

  /**
   * Set menu item group ID
   * @param id - menu item group ID
   * @returns menu item group builder based on ID provided. See {@link MenuItemGroupBuilder}
   */
  id(id: string): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder(this._context, {id, title: this._title, i18n: this._i18n})
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
    return new MenuItemGroupBuilder(this._context, {title, id: this._id, i18n: this._i18n})
  }

  /**
   * Get menu item group title
   * @returns menu item group title
   */
  getTitle(): string {
    return this._title
  }

  /**
   * Set the i18n key and namespace used to populate the localized title.
   * @param i18n - object with i18n key and related namespace
   * @returns menu item group builder based on i18n info provided. See {@link MenuItemGroupBuilder}
   */
  i18n(i18n: I18nTextRecord<'title'>): MenuItemGroupBuilder {
    return new MenuItemGroupBuilder(this._context, {i18n, id: this._id, title: this._title})
  }

  /**
   * Get the i18n key and namespace used to populate the localized title.
   * @returns the i18n key and namespace used to populate the localized title.
   */
  getI18n(): I18nTextRecord<'title'> | undefined {
    return this._i18n
  }

  /**
   * Serialize menu item group builder
   * @param options - serialization options (path). See {@link SerializeOptions}
   * @returns menu item group based on path provided in options. See {@link MenuItemGroup}
   */
  serialize(options: SerializeOptions = {path: []}): MenuItemGroup {
    const {_id, _title, _i18n} = this
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
      i18n: _i18n,
    }
  }
}
