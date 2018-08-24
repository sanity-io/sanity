import {getExtendedProjection} from './util/getExtendedProjection'
import {SchemaType, defaultSchema} from './parts/Schema'
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
    this.spec.action = action
    return this
  }

  intent(intent: Intent): MenuItemBuilder {
    this.spec.intent = intent
    return this
  }

  title(title: string): MenuItemBuilder {
    this.spec.title = title
    return this
  }

  group(group: string): MenuItemBuilder {
    this.spec.group = group
    return this
  }

  icon(icon: Function): MenuItemBuilder {
    this.spec.icon = icon
    return this
  }

  params(params: object): MenuItemBuilder {
    this.spec.params = params
    return this
  }

  showAsAction(asAction: boolean | ShowAsAction): MenuItemBuilder {
    this.spec.showAsAction = asAction
    return this
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
  const type = typeof typeName === 'string' ? defaultSchema.get(typeName) : typeName

  return (type.orderings
    ? type.orderings.concat(DEFAULT_ORDERING_OPTIONS)
    : DEFAULT_ORDERING_OPTIONS
  ).map((ordering: Ordering) =>
    getOrderingMenuItem(ordering, getExtendedProjection(type, ordering.by))
  )
}
