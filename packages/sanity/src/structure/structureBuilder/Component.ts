import {type I18nTextRecord} from 'sanity'

import {type IntentChecker} from './Intent'
import {maybeSerializeMenuItem, type MenuItem, type MenuItemBuilder} from './MenuItem'
import {
  maybeSerializeMenuItemGroup,
  type MenuItemGroup,
  type MenuItemGroupBuilder,
} from './MenuItemGroup'
import {HELP_URL, SerializeError} from './SerializeError'
import {
  type Child,
  type Serializable,
  type SerializeOptions,
  type StructureNode,
} from './StructureNodes'
import {type UserComponent} from './types'
import {getStructureNodeId} from './util/getStructureNodeId'
import {validateId} from './util/validateId'

/**
 * Interface for component
 *
 * @public
 */
// TODO: rename to `StructureComponent` since it clashes with React?
export interface Component extends StructureNode {
  /** Component of type {@link UserComponent} */
  component: UserComponent
  /** Component child of type {@link Child} */
  child?: Child
  /** Component menu items, array of type {@link MenuItem} */
  menuItems: MenuItem[]
  /** Component menu item group, array of type {@link MenuItemGroup} */
  menuItemGroups: MenuItemGroup[]
  /** Component options */
  options: {[key: string]: unknown}
  canHandleIntent?: IntentChecker
}

/**
 * Interface for component input
 *
 * @public
 */
export interface ComponentInput extends StructureNode {
  /** Component of type {@link UserComponent} */
  component: UserComponent
  /** Component child of type {@link Child} */
  child?: Child
  /** Component options */
  options?: {[key: string]: unknown}
  /** Component menu items. See {@link MenuItem} and {@link MenuItemBuilder}  */
  menuItems?: (MenuItem | MenuItemBuilder)[]
  /** Component menu item groups. See {@link MenuItemGroup} and {@link MenuItemGroupBuilder} */
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

/**
 * Interface for buildable component
 *
 * @public
 */
export interface BuildableComponent extends Partial<StructureNode> {
  /** Component of type {@link UserComponent} */
  component?: UserComponent
  /** Component child of type {@link Child} */
  child?: Child
  /** Component options */
  options?: {[key: string]: unknown}
  /** Component menu items. See {@link MenuItem} and {@link MenuItemBuilder}  */
  menuItems?: (MenuItem | MenuItemBuilder)[]
  /** Component menu item groups. See {@link MenuItemGroup} and {@link MenuItemGroupBuilder} */
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
  canHandleIntent?: IntentChecker
}

/**
 * Class for building components
 *
 * @public
 */
export class ComponentBuilder implements Serializable<Component> {
  /** component builder option object */
  protected spec: BuildableComponent

  constructor(spec?: ComponentInput) {
    this.spec = {options: {}, ...(spec ? spec : {})}
  }

  /** Set Component ID
   * @param id - component ID
   * @returns component builder based on ID provided
   */
  id(id: string): ComponentBuilder {
    return this.clone({id})
  }

  /** Get ID
   * @returns ID
   */
  getId(): BuildableComponent['id'] {
    return this.spec.id
  }

  /** Set Component title
   * @param title - component title
   * @returns component builder based on title provided (and ID)
   */
  title(title: string): ComponentBuilder {
    return this.clone({title, id: getStructureNodeId(title, this.spec.id)})
  }

  /** Get Component title
   * @returns title
   */
  getTitle(): BuildableComponent['title'] {
    return this.spec.title
  }

  /** Set the i18n key and namespace used to populate the localized title.
   * @param i18n - the key and namespaced used to populate the localized title.
   * @returns component builder based on i18n key and ns provided
   */
  i18n(i18n: I18nTextRecord<'title'>): ComponentBuilder {
    return this.clone({i18n})
  }

  /** Get i18n key and namespace used to populate the localized title
   * @returns the i18n key and namespace used to populate the localized title
   */
  getI18n(): I18nTextRecord<'title'> | undefined {
    return this.spec.i18n
  }

  /** Set Component child
   * @param child - child component
   * @returns component builder based on child component provided
   */
  child(child: Child): ComponentBuilder {
    return this.clone({child})
  }

  /** Get Component child
   * @returns child component
   */
  getChild(): BuildableComponent['child'] {
    return this.spec.child
  }

  /** Set component
   * @param component - user built component
   * @returns component builder based on component provided
   */
  component(component: UserComponent): ComponentBuilder {
    return this.clone({component})
  }

  /** Get Component
   * @returns component
   */
  getComponent(): BuildableComponent['component'] {
    return this.spec.component
  }

  /** Set Component options
   * @param options - component options
   * @returns component builder based on options provided
   */
  options(options: {[key: string]: unknown}): ComponentBuilder {
    return this.clone({options})
  }

  /** Get Component options
   * @returns component options
   */
  getOptions(): NonNullable<BuildableComponent['options']> {
    return this.spec.options || {}
  }

  /** Set Component menu items
   * @param menuItems - component menu items
   * @returns component builder based on menuItems provided
   */
  menuItems(menuItems: (MenuItem | MenuItemBuilder)[]): ComponentBuilder {
    return this.clone({menuItems})
  }

  /** Get Component menu items
   * @returns menu items
   */
  getMenuItems(): BuildableComponent['menuItems'] {
    return this.spec.menuItems
  }

  /** Set Component menu item groups
   * @param menuItemGroups - component menu item groups
   * @returns component builder based on menuItemGroups provided
   */
  menuItemGroups(menuItemGroups: (MenuItemGroup | MenuItemGroupBuilder)[]): ComponentBuilder {
    return this.clone({menuItemGroups})
  }

  /** Get Component menu item groups
   * @returns menu item groups
   */
  getMenuItemGroups(): BuildableComponent['menuItemGroups'] {
    return this.spec.menuItemGroups
  }

  canHandleIntent(canHandleIntent: IntentChecker): ComponentBuilder {
    return this.clone({canHandleIntent})
  }

  /** Serialize component
   * @param options - serialization options
   * @returns component object based on path provided in options
   *
   */
  serialize(options: SerializeOptions = {path: []}): Component {
    const {id, title, child, options: componentOptions, component} = this.spec
    if (!id) {
      throw new SerializeError(
        '`id` is required for `component` structure item',
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!component) {
      throw new SerializeError(
        '`component` is required for `component` structure item',
        options.path,
        options.index,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    return {
      id: validateId(id, options.path, options.index),
      title,
      type: 'component',
      child,
      component,
      canHandleIntent: this.spec.canHandleIntent,
      options: componentOptions || {},
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, options.path),
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, options.path),
      ),
    }
  }

  /** Clone component builder (allows for options overriding)
   * @param withSpec - component builder options
   * @returns cloned builder
   */
  clone(withSpec?: BuildableComponent): ComponentBuilder {
    const builder = new ComponentBuilder()
    builder.spec = {...this.spec, ...withSpec}
    return builder
  }
}
