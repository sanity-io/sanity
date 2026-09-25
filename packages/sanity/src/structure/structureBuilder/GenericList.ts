import {type I18nTextRecord, type InitialValueTemplateItem, type PreviewLayoutKey} from 'sanity'

import {
  type InitialValueTemplateItemBuilder,
  maybeSerializeInitialValueTemplateItem,
} from './InitialValueTemplateItem'
import {defaultIntentChecker, type IntentChecker} from './Intent'
import {layoutOptions} from './Layout'
import {maybeSerializeMenuItem, type MenuItem, type MenuItemBuilder} from './MenuItem'
import {
  maybeSerializeMenuItemGroup,
  type MenuItemGroup,
  type MenuItemGroupBuilder,
} from './MenuItemGroup'
import {SerializeError} from './SerializeError'
import {
  type Child,
  type Serializable,
  type SerializeOptions,
  type StructureNode,
} from './StructureNodes'
import {getStructureNodeId} from './util/getStructureNodeId'
import {serializableMarker} from './util/isSerializable'
import {validateId} from './util/validateId'

function noChildResolver() {
  return undefined
}

/** @internal */
export const shallowIntentChecker: IntentChecker = (intentName, params, {pane, index}): boolean => {
  return index <= 1 && defaultIntentChecker(intentName, params, {pane, index})
}

/**
 * Interface for list display options
 *
 * @public */
export interface ListDisplayOptions {
  /** Check if list display should show icons */
  showIcons?: boolean
}

/**
 * Interface for base generic list
 *
 * @public
 */
export interface BaseGenericList extends StructureNode {
  /** List layout key. */
  defaultLayout?: PreviewLayoutKey
  /** Can handle intent. See {@link IntentChecker} */
  canHandleIntent?: IntentChecker
  /** List display options. See {@link ListDisplayOptions} */
  displayOptions?: ListDisplayOptions
  /** List child. See {@link Child} */
  child: Child
  /** List initial values array. See {@link InitialValueTemplateItem} and {@link InitialValueTemplateItemBuilder} */
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
  /** Minimum width of the list pane in pixels. Defaults to 320 */
  minWidth?: number
  /** Maximum width of the list pane before it is manually resized, in pixels. Defaults to 350 */
  currentMaxWidth?: number
  /** Maximum width of the list pane in pixels. Defaults to 640 */
  maxWidth?: number
}

/**
 * Interface for generic list
 *
 * @public
 */
// "POJO"/verbatim-version - end result
export interface GenericList extends BaseGenericList {
  /** List type */
  type: string
  /** List menu items array. See {@link MenuItem} */
  menuItems: MenuItem[]
  /** List menu item groups array. See {@link MenuItemGroup} */
  menuItemGroups: MenuItemGroup[]
}

/**
 * Interface for buildable generic list
 *
 * @public
 */
// Used internally in builder classes to make everything optional
export interface BuildableGenericList extends Partial<BaseGenericList> {
  /** List menu items array. See {@link MenuItem} and {@link MenuItemBuilder} */
  menuItems?: (MenuItem | MenuItemBuilder)[]
  /** List menu items groups array. See {@link MenuItemGroup} and {@link MenuItemGroupBuilder} */
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

/**
 * Interface for generic list input
 * Allows builders and only requires things not inferrable
 *
 * @public */
// Input version, allows builders and only requires things not inferrable
export interface GenericListInput extends StructureNode {
  /** Input id */
  id: string
  /** Input title */
  title: string
  /** Input menu items groups. See {@link MenuItem} and {@link MenuItemBuilder} */
  menuItems?: (MenuItem | MenuItemBuilder)[]
  /** Input menu items groups. See {@link MenuItemGroup} and {@link MenuItemGroupBuilder} */
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
  /** Input initial value array. See {@link InitialValueTemplateItem} and {@link InitialValueTemplateItemBuilder} */
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
  /** Input default layout. */
  defaultLayout?: PreviewLayoutKey
  /** If input can handle intent. See {@link IntentChecker} */
  canHandleIntent?: IntentChecker
  /** Input child of type {@link Child} */
  child?: Child
  /** Minimum width of the list pane in pixels. Defaults to 320 */
  minWidth?: number
  /** Maximum width of the list pane before it is manually resized, in pixels. Defaults to 350 */
  currentMaxWidth?: number
  /** Maximum width of the list pane in pixels. Defaults to 640 */
  maxWidth?: number
}

/**
 * Class for building generic lists
 *
 * @public
 */
export abstract class GenericListBuilder<
  TList extends BuildableGenericList,
  ConcreteImpl,
> implements Serializable<GenericList> {
  /** Brand consumed by `isSerializable` (avoids circular `instanceof` imports) */
  readonly [serializableMarker] = true
  /** Check if initial value templates are set */
  protected initialValueTemplatesSpecified = false
  /** Generic list option object */
  protected spec: TList = {} as TList

  /** Set generic list ID
   * @param id - generic list ID
   * @returns generic list builder based on ID provided.
   */
  id(id: string): ConcreteImpl {
    return this.clone({id})
  }

  /** Get generic list ID
   * @returns generic list ID
   */
  getId(): TList['id'] {
    return this.spec.id
  }

  /** Set generic list title
   * @param title - generic list title
   * @returns generic list builder based on title and ID provided.
   */
  title(title: string): ConcreteImpl {
    return this.clone({title, id: getStructureNodeId(title, this.spec.id)})
  }

  /** Get generic list title
   * @returns generic list title
   */
  getTitle(): TList['title'] {
    return this.spec.title
  }

  /** Set the i18n key and namespace used to populate the localized title.
   * @param i18n - the key and namespaced used to populate the localized title.
   * @returns component builder based on i18n key and ns provided
   */
  i18n(i18n: I18nTextRecord<'title'>): ConcreteImpl {
    return this.clone({i18n})
  }

  /** Get i18n key and namespace used to populate the localized title
   * @returns the i18n key and namespace used to populate the localized title
   */
  getI18n(): TList['i18n'] {
    return this.spec.i18n
  }

  /** Set generic list layout
   * @param defaultLayout - generic list layout key.
   * @returns generic list builder based on layout provided.
   */
  defaultLayout(defaultLayout: PreviewLayoutKey): ConcreteImpl {
    return this.clone({defaultLayout})
  }

  /** Get generic list layout
   * @returns generic list layout
   */
  getDefaultLayout(): TList['defaultLayout'] {
    return this.spec.defaultLayout
  }

  /** Set generic list menu items
   * @param menuItems - generic list menu items. See {@link MenuItem} and {@link MenuItemBuilder}
   * @returns generic list builder based on menu items provided.
   */
  menuItems(menuItems: (MenuItem | MenuItemBuilder)[] | undefined): ConcreteImpl {
    return this.clone({menuItems})
  }

  /** Get generic list menu items
   * @returns generic list menu items
   */
  getMenuItems(): TList['menuItems'] {
    return this.spec.menuItems
  }

  /** Set generic list menu item groups
   * @param menuItemGroups - generic list menu item groups. See {@link MenuItemGroup} and {@link MenuItemGroupBuilder}
   * @returns generic list builder based on menu item groups provided.
   */
  menuItemGroups(menuItemGroups: (MenuItemGroup | MenuItemGroupBuilder)[]): ConcreteImpl {
    return this.clone({menuItemGroups})
  }

  /** Get generic list menu item groups
   * @returns generic list menu item groups
   */
  getMenuItemGroups(): TList['menuItemGroups'] {
    return this.spec.menuItemGroups
  }

  /** Set generic list child
   * @param child - generic list child. See {@link Child}
   * @returns generic list builder based on child provided (clone).
   */
  child(child: Child): ConcreteImpl {
    return this.clone({child})
  }

  /** Get generic list child
   * @returns generic list child
   */
  getChild(): TList['child'] {
    return this.spec.child
  }

  /** Set generic list can handle intent
   * @param canHandleIntent - generic list intent checker. See {@link IntentChecker}
   * @returns generic list builder based on can handle intent provided.
   */
  canHandleIntent(canHandleIntent?: IntentChecker): ConcreteImpl {
    return this.clone({canHandleIntent})
  }

  /** Get generic list can handle intent
   * @returns generic list can handle intent
   */
  getCanHandleIntent(): TList['canHandleIntent'] {
    return this.spec.canHandleIntent
  }

  /** Set generic list display options
   * @param enabled - allow / disallow for showing icons
   * @returns generic list builder based on display options (showIcons) provided.
   */
  showIcons(enabled = true): ConcreteImpl {
    return this.clone({
      displayOptions: {...this.spec.displayOptions, showIcons: enabled},
    })
  }

  /** Get generic list display options
   * @returns generic list display options (specifically showIcons)
   */
  getShowIcons(): boolean | undefined {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcons : undefined
  }

  /** Set the minimum width of the list pane
   * @param minWidth - Minimum width in pixels
   * @returns generic list builder with the minimum width applied
   */
  minWidth(minWidth: number): ConcreteImpl {
    return this.clone({minWidth})
  }

  /** Get the minimum width of the list pane
   * @returns minimum width in pixels
   */
  getMinWidth(): TList['minWidth'] {
    return this.spec.minWidth
  }

  /** Set the maximum width of the list pane before it is manually resized
   * @param currentMaxWidth - Maximum width in pixels before manual resizing
   * @returns generic list builder with the current maximum width applied
   */
  currentMaxWidth(currentMaxWidth: number): ConcreteImpl {
    return this.clone({currentMaxWidth})
  }

  /** Get the maximum width of the list pane before it is manually resized
   * @returns current maximum width in pixels
   */
  getCurrentMaxWidth(): TList['currentMaxWidth'] {
    return this.spec.currentMaxWidth
  }

  /** Set the maximum width of the list pane
   * @param maxWidth - Maximum width in pixels
   * @returns generic list builder with the maximum width applied
   */
  maxWidth(maxWidth: number): ConcreteImpl {
    return this.clone({maxWidth})
  }

  /** Get the maximum width of the list pane
   * @returns maximum width in pixels
   */
  getMaxWidth(): TList['maxWidth'] {
    return this.spec.maxWidth
  }

  /** Set generic list initial value templates
   * @param templates - generic list initial value templates. See {@link InitialValueTemplateItemBuilder}
   * @returns generic list builder based on templates provided.
   */
  initialValueTemplates(
    templates:
      | InitialValueTemplateItem
      | InitialValueTemplateItemBuilder
      | Array<InitialValueTemplateItem | InitialValueTemplateItemBuilder>,
  ): ConcreteImpl {
    this.initialValueTemplatesSpecified = true
    return this.clone({initialValueTemplates: Array.isArray(templates) ? templates : [templates]})
  }

  /** Get generic list initial value templates
   * @returns generic list initial value templates
   */
  getInitialValueTemplates(): TList['initialValueTemplates'] {
    return this.spec.initialValueTemplates
  }

  /** Serialize generic list
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns generic list object based on path provided in options. See {@link GenericList}
   */
  serialize(options: SerializeOptions = {path: []}): GenericList {
    const id = this.spec.id || ''
    const path = options.path

    const defaultLayout = this.spec.defaultLayout
    if (defaultLayout && !layoutOptions.includes(defaultLayout)) {
      throw new SerializeError(
        `\`layout\` must be one of ${layoutOptions.map((item) => `"${item}"`).join(', ')}`,
        path,
        id || options.index,
        this.spec.title,
      )
    }

    const initialValueTemplates = (this.spec.initialValueTemplates || []).map((item, i) =>
      maybeSerializeInitialValueTemplateItem(item, i, path),
    )

    return {
      id: validateId(id, options.path, id || options.index),
      title: this.spec.title,
      i18n: this.spec.i18n,
      type: 'genericList',
      defaultLayout,
      child: this.spec.child || noChildResolver,
      canHandleIntent: this.spec.canHandleIntent || shallowIntentChecker,
      displayOptions: this.spec.displayOptions,
      minWidth: this.spec.minWidth,
      currentMaxWidth: this.spec.currentMaxWidth,
      maxWidth: this.spec.maxWidth,
      initialValueTemplates,
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, path),
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, path),
      ),
    }
  }

  /** Clone generic list builder (allows for options overriding)
   * @param _withSpec - generic list options.
   * @returns generic list builder.
   */
  abstract clone(_withSpec?: object): ConcreteImpl
}
