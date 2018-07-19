import {SerializeOptions, StructureNode, Serializable} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'

export interface Component extends StructureNode {
  component: Function
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
}

export interface ComponentInput extends StructureNode {
  component: Function
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

export interface BuildableList extends Partial<StructureNode> {
  component?: Function
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

export class ComponentBuilder implements Serializable {
  protected spec: BuildableList

  constructor(spec?: ComponentInput) {
    this.spec = spec ? spec : {}
  }

  id(id: string) {
    this.spec.id = id
    return this
  }

  title(title: string) {
    this.spec.title = title
    return this
  }

  component(component: Function) {
    this.spec.component = component
    return this
  }

  menuItems(items: (MenuItem | MenuItemBuilder)[]) {
    this.spec.menuItems = items
    return this
  }

  menuItemGroups(groups: (MenuItemGroup | MenuItemGroupBuilder)[]) {
    this.spec.menuItemGroups = groups
    return this
  }

  serialize(options: SerializeOptions = {path: []}): Component {
    const {id, title, component} = this.spec
    if (typeof id !== 'string' || !id) {
      throw new SerializeError(
        '`id` is required for `component` structure item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!component) {
      throw new SerializeError(
        '`component` is required for `component` structure item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    return {
      id,
      title,
      type: 'component',
      component,
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, options.path)
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, options.path)
      )
    }
  }
}
