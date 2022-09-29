import {SchemaType, SortOrdering, SortOrderingItem} from '@sanity/types'
import {SortIcon} from '@sanity/icons'
import {getExtendedProjection} from './util/getExtendedProjection'
import {Intent} from './Intent'
import {DEFAULT_ORDERING_OPTIONS} from './Sort'
import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {StructureContext} from './types'

/** @internal */
export function maybeSerializeMenuItem(
  item: MenuItem | MenuItemBuilder,
  index: number,
  path: SerializePath
): MenuItem {
  return item instanceof MenuItemBuilder ? item.serialize({path, index}) : item
}

/** @beta */
export type MenuItemActionType =
  | string
  | ((params: Record<string, string> | undefined, scope?: any) => void)

/** @beta */
export type MenuItemParamsType = Record<string, string | unknown | undefined>

/** @beta */
export interface MenuItem {
  title: string
  action?: MenuItemActionType
  intent?: Intent
  group?: string
  // TODO: align these with TemplateResponse['icon']
  icon?: React.ComponentType | React.ReactNode
  params?: MenuItemParamsType
  showAsAction?: boolean
}

/** @beta */
export type PartialMenuItem = Partial<MenuItem>

/** @beta */
export class MenuItemBuilder implements Serializable<MenuItem> {
  protected spec: PartialMenuItem

  constructor(protected _context: StructureContext, spec?: MenuItem) {
    this.spec = spec ? spec : {}
  }

  action(action: MenuItemActionType): MenuItemBuilder {
    return this.clone({action})
  }

  getAction(): PartialMenuItem['action'] {
    return this.spec.action
  }

  intent(intent: Intent): MenuItemBuilder {
    return this.clone({intent})
  }

  getIntent(): PartialMenuItem['intent'] {
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

  getGroup(): PartialMenuItem['group'] {
    return this.spec.group
  }

  icon(icon: React.ComponentType | React.ReactNode): MenuItemBuilder {
    return this.clone({icon})
  }

  getIcon(): PartialMenuItem['icon'] {
    return this.spec.icon
  }

  params(params: MenuItemParamsType): MenuItemBuilder {
    return this.clone({params})
  }

  getParams(): PartialMenuItem['params'] {
    return this.spec.params
  }

  showAsAction(showAsAction = true): MenuItemBuilder {
    return this.clone({showAsAction: Boolean(showAsAction)})
  }

  getShowAsAction(): PartialMenuItem['showAsAction'] {
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
  ordering: SortOrdering,
  extendedProjection?: string
): MenuItemBuilder {
  return new MenuItemBuilder(context)
    .group('sorting')
    .title(`Sort by ${ordering.title}`)
    .icon(SortIcon)
    .action('setSortOrder')
    .params({by: ordering.by, extendedProjection})
}

/** @internal */
export function getOrderingMenuItemsForSchemaType(
  context: StructureContext,
  typeName: SchemaType | string
): MenuItemBuilder[] {
  const {schema} = context
  const type = typeof typeName === 'string' ? schema.get(typeName) : typeName
  if (!type || !('orderings' in type)) {
    return []
  }

  return (
    type.orderings ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS) : DEFAULT_ORDERING_OPTIONS
  ).map((ordering: SortOrdering) =>
    getOrderingMenuItem(context, ordering, getExtendedProjection(type, ordering.by))
  )
}
