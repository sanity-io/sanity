import {getExtendedProjection} from './util/getExtendedProjection'
import {SchemaType, getDefaultSchema} from './parts/Schema'
import {getSortIcon} from './parts/Icon'
import {Intent} from './Intent'
import {Partial} from './Partial'
import {SortItem, Ordering, DEFAULT_ORDERING_OPTIONS} from './Sort'
import {SerializeOptions, Serializable, SerializePath} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'

const SortIcon = getSortIcon()

export function maybeSerializeMenuItem(
  item: MenuItem | MenuItemBuilder,
  index: number,
  path: SerializePath
): MenuItem {
  return item instanceof MenuItemBuilder ? item.serialize({path, index}) : item
}

type ShowAsAction = {
  whenCollapsed: boolean
}

export interface MenuItem {
  title: string
  action?: string | Function
  intent?: Intent
  group?: string
  icon?: Function
  params?: object
  showAsAction?: boolean | ShowAsAction
}

export type PartialMenuItem = Partial<MenuItem>

export class MenuItemBuilder implements Serializable {
  protected spec: PartialMenuItem

  constructor(spec?: MenuItem) {
    this.spec = spec ? spec : {}
  }

  action(action: string | Function): MenuItemBuilder {
    return this.clone({action})
  }

  getAction() {
    return this.spec.action
  }

  intent(intent: Intent): MenuItemBuilder {
    return this.clone({intent})
  }

  getIntent() {
    return this.spec.intent
  }

  title(title: string): MenuItemBuilder {
    return this.clone({title})
  }

  getTitle() {
    return this.spec.title
  }

  group(group: string): MenuItemBuilder {
    return this.clone({group})
  }

  getGroup() {
    return this.spec.group
  }

  icon(icon: Function): MenuItemBuilder {
    return this.clone({icon})
  }

  getIcon() {
    return this.spec.icon
  }

  params(params: object): MenuItemBuilder {
    return this.clone({params})
  }

  getParams() {
    return this.spec.params
  }

  showAsAction(showAsAction: boolean | ShowAsAction): MenuItemBuilder {
    return this.clone({showAsAction})
  }

  getShowAsAction() {
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
    by: SortItem[]
  }
}

export function getOrderingMenuItem(ordering: Ordering, extendedProjection?: string) {
  return new MenuItemBuilder()
    .group('sorting')
    .title(`Sort by ${ordering.title}`)
    .icon(SortIcon)
    .action('setSortOrder')
    .params({by: ordering.by, extendedProjection})
}

export function getOrderingMenuItemsForSchemaType(typeName: SchemaType | string) {
  const type = typeof typeName === 'string' ? getDefaultSchema().get(typeName) : typeName
  if (!type) {
    return []
  }

  return (type.orderings
    ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS)
    : DEFAULT_ORDERING_OPTIONS
  ).map((ordering: Ordering) =>
    getOrderingMenuItem(ordering, getExtendedProjection(type, ordering.by))
  )
}
