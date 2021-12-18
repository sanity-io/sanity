import {Schema, SchemaType, SortOrdering, SortOrderingItem} from '@sanity/types'
import {SortIcon} from '@sanity/icons'
import {getExtendedProjection} from './util/getExtendedProjection'
import {Intent} from './Intent'
import {DEFAULT_ORDERING_OPTIONS} from './Sort'
import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'

export function maybeSerializeMenuItem(
  item: MenuItem | MenuItemBuilder,
  index: number,
  path: SerializePath
): MenuItem {
  return item instanceof MenuItemBuilder ? item.serialize({path, index}) : item
}

/**
 * @deprecated
 *
 * this option is unused. provide `true` instead of an object
 */
type ShowAsAction = {
  /**
   * @deprecated
   *
   * this option is unused. provide `true` instead of an object
   */
  whenCollapsed: boolean
}

type ActionType = string | ((params: Record<string, string> | undefined, scope?: any) => void)
type ParamsType = Record<string, string | unknown | undefined>

export interface MenuItem {
  title: string
  action?: ActionType
  intent?: Intent
  group?: string
  icon?: React.ComponentType
  params?: ParamsType
  showAsAction?: boolean
}

export type PartialMenuItem = Partial<MenuItem>

export class MenuItemBuilder implements Serializable {
  protected spec: PartialMenuItem

  constructor(spec?: MenuItem) {
    this.spec = spec ? spec : {}
  }

  action(action: ActionType): MenuItemBuilder {
    return this.clone({action})
  }

  getAction(): ActionType | undefined {
    return this.spec.action
  }

  intent(intent: Intent): MenuItemBuilder {
    return this.clone({intent})
  }

  getIntent(): Intent | undefined {
    return this.spec.intent
  }

  title(title: string): MenuItemBuilder {
    return this.clone({title})
  }

  getTitle(): string | undefined {
    return this.spec.title
  }

  group(group: string): MenuItemBuilder {
    return this.clone({group})
  }

  getGroup(): string | undefined {
    return this.spec.group
  }

  icon(icon: React.ComponentType): MenuItemBuilder {
    return this.clone({icon})
  }

  getIcon(): React.ComponentType | undefined {
    return this.spec.icon
  }

  params(params: ParamsType): MenuItemBuilder {
    return this.clone({params})
  }

  getParams(): ParamsType | undefined {
    return this.spec.params
  }

  showAsAction(showAsAction: boolean | ShowAsAction = true): MenuItemBuilder {
    return this.clone({showAsAction: Boolean(showAsAction)})
  }

  getShowAsAction(): boolean | undefined {
    return this.spec.showAsAction
  }

  serialize(options: SerializeOptions = {path: []}): MenuItem {
    const {title, action, intent} = this.spec
    if (!title) {
      const hint = typeof action === 'string' ? `action: "${action}"` : undefined
      throw new SerializeError(
        '`title` is required for menu item',
        options.path,
        options.index,
        hint
      ).withHelpUrl(HELP_URL.TITLE_REQUIRED)
    }

    if (!action && !intent) {
      throw new SerializeError(
        `\`action\` or \`intent\` required for menu item with title ${this.spec.title}`,
        options.path,
        options.index,
        `"${title}"`
      ).withHelpUrl(HELP_URL.ACTION_OR_INTENT_REQUIRED)
    }

    if (intent && action) {
      throw new SerializeError(
        'cannot set both `action` AND `intent`',
        options.path,
        options.index,
        `"${title}"`
      ).withHelpUrl(HELP_URL.ACTION_AND_INTENT_MUTUALLY_EXCLUSIVE)
    }

    return {...this.spec, title}
  }

  clone(withSpec?: PartialMenuItem): MenuItemBuilder {
    const builder = new MenuItemBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}

export interface SortMenuItem extends MenuItem {
  params: {
    by: SortOrderingItem[]
  }
}

export function getOrderingMenuItem(
  ordering: SortOrdering,
  extendedProjection?: string
): MenuItemBuilder {
  return new MenuItemBuilder()
    .group('sorting')
    .title(`Sort by ${ordering.title}`)
    .icon(SortIcon)
    .action('setSortOrder')
    .params({by: ordering.by, extendedProjection})
}

export function getOrderingMenuItemsForSchemaType(
  schema: Schema,
  typeName: SchemaType | string
): MenuItemBuilder[] {
  const type = typeof typeName === 'string' ? schema.get(typeName) : typeName
  if (!type) {
    return []
  }

  return (
    type && 'orderings' in type
      ? type.orderings?.concat(DEFAULT_ORDERING_OPTIONS) || []
      : DEFAULT_ORDERING_OPTIONS
  ).map((ordering) => getOrderingMenuItem(ordering, getExtendedProjection(type, ordering.by)))
}
