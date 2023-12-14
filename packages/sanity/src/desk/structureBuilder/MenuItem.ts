import {SchemaType, SortOrdering, SortOrderingItem} from '@sanity/types'
import {SortIcon} from '@sanity/icons'
import {getExtendedProjection} from './util/getExtendedProjection'
import {Intent} from './Intent'
import {DEFAULT_ORDERING_OPTIONS} from './Sort'
import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {StructureContext} from './types'
import {I18nTextRecord} from 'sanity'

/** @internal */
export function maybeSerializeMenuItem(
  item: MenuItem | MenuItemBuilder,
  index: number,
  path: SerializePath,
): MenuItem {
  return item instanceof MenuItemBuilder ? item.serialize({path, index}) : item
}

/**
 * Menu item action type
 * @public */
export type MenuItemActionType =
  | string
  | ((params: Record<string, string> | undefined, scope?: any) => void)

/**
 * Menu items parameters
 *
 * @public */
export type MenuItemParamsType = Record<string, string | unknown | undefined>

/**
 * Interface for menu items
 *
 * @public */
export interface MenuItem {
  /**
   * The i18n key and namespace used to populate the localized title. This is
   * the recommend way to set the title if you are localizing your studio.
   */
  i18n?: I18nTextRecord<'title'>
  /**
   * Menu Item title. Note that the `i18n` configuration will take
   * precedence and this title is left here as a fallback if no i18n key is
   * provided and compatibility with older plugins
   */
  title: string
  /** Menu Item action */
  action?: MenuItemActionType
  /** Menu Item intent */
  intent?: Intent
  /** Menu Item group */
  group?: string
  // TODO: align these with TemplateItem['icon']
  /** Menu Item icon */
  icon?: React.ComponentType | React.ReactNode
  /** Menu Item parameters. See {@link MenuItemParamsType} */
  params?: MenuItemParamsType
  /** Determine if it will show the MenuItem as action */
  showAsAction?: boolean
}

/**
 * Partial menu items
 * @public
 */
export type PartialMenuItem = Partial<MenuItem>

/**
 * Class for building menu items.
 *
 * @public */
export class MenuItemBuilder implements Serializable<MenuItem> {
  /** menu item option object. See {@link PartialMenuItem} */
  protected spec: PartialMenuItem

  constructor(
    /**
     * Desk structure context. See {@link StructureContext}
     */
    protected _context: StructureContext,
    spec?: MenuItem,
  ) {
    this.spec = spec ? spec : {}
  }

  /**
   * Set menu item action
   * @param action - menu item action. See {@link MenuItemActionType}
   * @returns menu item builder based on action provided. See {@link MenuItemBuilder}
   */
  action(action: MenuItemActionType): MenuItemBuilder {
    return this.clone({action})
  }

  /**
   * Get menu item action
   * @returns menu item builder action. See {@link PartialMenuItem}
   */
  getAction(): PartialMenuItem['action'] {
    return this.spec.action
  }

  /**
   * Set menu item intent
   * @param intent - menu item intent. See {@link Intent}
   * @returns menu item builder based on intent provided. See {@link MenuItemBuilder}
   */
  intent(intent: Intent): MenuItemBuilder {
    return this.clone({intent})
  }

  /**
   * Get menu item intent
   * @returns menu item intent. See {@link PartialMenuItem}
   */
  getIntent(): PartialMenuItem['intent'] {
    return this.spec.intent
  }

  /**
   * Set menu item title
   * @param title - menu item title
   * @returns menu item builder based on title provided. See {@link MenuItemBuilder}
   */
  title(title: string): MenuItemBuilder {
    return this.clone({title})
  }

  /**
   * Get menu item title. Note that the `i18n` configuration will take
   * precedence and this title is left here for compatibility.
   * @returns menu item title
   */
  getTitle(): string | undefined {
    return this.spec.title
  }

  /**
   * Set the i18n key and namespace used to populate the localized title.
   * @param i18n - object with i18n key and related namespace
   * @returns menu item builder based on i18n config provided. See {@link MenuItemBuilder}
   */
  i18n(i18n: I18nTextRecord<'title'>): MenuItemBuilder {
    return this.clone({i18n})
  }

  /**
   * Get the i18n key and namespace used to populate the localized title.
   * @returns the i18n key and namespace used to populate the localized title.
   */
  getI18n(): I18nTextRecord<'title'> | undefined {
    return this.spec.i18n
  }

  /**
   * Set menu item group
   * @param group - menu item group
   * @returns menu item builder based on group provided. See {@link MenuItemBuilder}
   */
  group(group: string): MenuItemBuilder {
    return this.clone({group})
  }

  /**
   * Get menu item group
   * @returns menu item group. See {@link PartialMenuItem}
   */
  getGroup(): PartialMenuItem['group'] {
    return this.spec.group
  }

  /**
   * Set menu item icon
   * @param icon - menu item icon
   * @returns menu item builder based on icon provided. See {@link MenuItemBuilder}
   */
  icon(icon: React.ComponentType | React.ReactNode): MenuItemBuilder {
    return this.clone({icon})
  }

  /**
   * Get menu item icon
   * @returns menu item icon. See {@link PartialMenuItem}
   */
  getIcon(): PartialMenuItem['icon'] {
    return this.spec.icon
  }

  /**
   * Set menu item parameters
   * @param params - menu item parameters. See {@link MenuItemParamsType}
   * @returns menu item builder based on parameters provided. See {@link MenuItemBuilder}
   */
  params(params: MenuItemParamsType): MenuItemBuilder {
    return this.clone({params})
  }

  /**
   * Get meny item parameters
   * @returns menu item parameters. See {@link PartialMenuItem}
   */
  getParams(): PartialMenuItem['params'] {
    return this.spec.params
  }

  /**
   * Set menu item to show as action
   * @param showAsAction - determine if menu item should show as action
   * @returns menu item builder based on if it should show as action. See {@link MenuItemBuilder}
   */
  showAsAction(showAsAction = true): MenuItemBuilder {
    return this.clone({showAsAction: Boolean(showAsAction)})
  }

  /**
   * Check if menu item should show as action
   * @returns true if menu item should show as action, false if not. See {@link PartialMenuItem}
   */
  getShowAsAction(): PartialMenuItem['showAsAction'] {
    return this.spec.showAsAction
  }

  /** Serialize menu item builder
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns menu item node based on path provided in options. See {@link MenuItem}
   */
  serialize(options: SerializeOptions = {path: []}): MenuItem {
    const {title, action, intent} = this.spec
    if (!title) {
      const hint = typeof action === 'string' ? `action: "${action}"` : undefined
      throw new SerializeError(
        '`title` is required for menu item',
        options.path,
        options.index,
        hint,
      ).withHelpUrl(HELP_URL.TITLE_REQUIRED)
    }

    if (!action && !intent) {
      throw new SerializeError(
        `\`action\` or \`intent\` required for menu item with title ${this.spec.title}`,
        options.path,
        options.index,
        `"${title}"`,
      ).withHelpUrl(HELP_URL.ACTION_OR_INTENT_REQUIRED)
    }

    if (intent && action) {
      throw new SerializeError(
        'cannot set both `action` AND `intent`',
        options.path,
        options.index,
        `"${title}"`,
      ).withHelpUrl(HELP_URL.ACTION_AND_INTENT_MUTUALLY_EXCLUSIVE)
    }

    return {...this.spec, title}
  }

  /** Clone menu item builder
   * @param withSpec - menu item options. See {@link PartialMenuItem}
   * @returns menu item builder based on context and spec provided. See {@link MenuItemBuilder}
   */
  clone(withSpec?: PartialMenuItem): MenuItemBuilder {
    const builder = new MenuItemBuilder(this._context)
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}

/** @internal */
export interface SortMenuItem extends MenuItem {
  params: {
    by: SortOrderingItem[]
  }
}

/** @internal */
export function getOrderingMenuItem(
  context: StructureContext,
  {by, title, i18n}: SortOrdering,
  extendedProjection?: string,
): MenuItemBuilder {
  let builder = new MenuItemBuilder(context)
    .group('sorting')
    .title(
      context.i18n.t('default-menu-item.fallback-title', {
        // note this lives in the `studio` bundle because that one is loaded by default
        ns: 'studio',
        defaultValue: `Sort by ${title}`, // fallback value
        replace: {title}, // replaces the `{{title}}` option
      }),
    ) // fallback title
    .icon(SortIcon)
    .action('setSortOrder')
    .params({by, extendedProjection})

  if (i18n) {
    builder = builder.i18n(i18n)
  }

  return builder
}

/** @internal */
export function getOrderingMenuItemsForSchemaType(
  context: StructureContext,
  typeName: SchemaType | string,
): MenuItemBuilder[] {
  const {schema} = context
  const type = typeof typeName === 'string' ? schema.get(typeName) : typeName
  if (!type || !('orderings' in type)) {
    return []
  }

  return (
    type.orderings ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS) : DEFAULT_ORDERING_OPTIONS
  ).map((ordering: SortOrdering) =>
    getOrderingMenuItem(context, ordering, getExtendedProjection(type, ordering.by)),
  )
}
