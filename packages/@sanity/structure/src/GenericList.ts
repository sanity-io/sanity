import {StructureNode} from './StructureNodes'
import {ChildResolver} from './ChildResolver'
import {Layout, LayoutOptions} from './Layout'
import {MenuItem, MenuItemBuilder} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder} from './MenuItemGroup'
import {IntentChecker} from './Intent'

function maybeSerializeMenuItemGroup(item: MenuItemGroup | MenuItemGroupBuilder): MenuItemGroup {
  return item instanceof MenuItemGroupBuilder ? item.serialize() : item
}

function maybeSerializeMenuItem(item: MenuItem | MenuItemBuilder): MenuItem {
  return item instanceof MenuItemBuilder ? item.serialize() : item
}

function noChildResolver() {
  return undefined
}

export interface GenericList extends StructureNode {
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  defaultLayout?: Layout
  canHandleIntent?: IntentChecker
  resolveChildForItem: ChildResolver
}

export type PartialGenericList = Partial<GenericList>

export abstract class GenericListBuilder<L extends PartialGenericList> {
  protected intentChecker?: IntentChecker

  constructor(protected spec: L) {}

  id(id: string) {
    this.spec.id = id
    return this
  }

  title(title: string) {
    this.spec.title = title
    return this
  }

  layout(layout: Layout) {
    if (!LayoutOptions.includes(layout)) {
      throw new Error(
        `\`layout\` must be one of ${LayoutOptions.map(item => `"${item}"`).join(', ')}`
      )
    }

    this.spec.defaultLayout = layout
    return this
  }

  menuItems(items: (MenuItem | MenuItemBuilder)[]) {
    this.spec.menuItems = items.map(maybeSerializeMenuItem)
    return this
  }

  menuItemGroups(groups: (MenuItemGroup | MenuItemGroupBuilder)[]) {
    this.spec.menuItemGroups = groups.map(maybeSerializeMenuItemGroup)
    return this
  }

  childResolver(resolver: ChildResolver) {
    this.spec.resolveChildForItem = resolver
    return this
  }

  canHandleIntent(checker: IntentChecker) {
    this.intentChecker = checker
    return this
  }

  serialize(): GenericList {
    return {
      id: this.spec.id || '',
      title: this.spec.title,
      type: 'genericList',
      defaultLayout: this.spec.defaultLayout,
      resolveChildForItem: this.spec.resolveChildForItem || noChildResolver,
      canHandleIntent: this.intentChecker,
      menuItems: this.spec.menuItems || [],
      menuItemGroups: this.spec.menuItemGroups || []
    }
  }
}
