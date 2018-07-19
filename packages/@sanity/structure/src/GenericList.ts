import {StructureNode, SerializeOptions, Serializable} from './StructureNodes'
import {ChildResolver} from './ChildResolver'
import {Layout, layoutOptions} from './Layout'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'
import {IntentChecker} from './Intent'
import {SerializeError} from './SerializeError'
import {getSerializedChildResolver} from './util/getSerializedChildResolver'

function noChildResolver() {
  return undefined
}

export interface BaseGenericList extends StructureNode {
  defaultLayout?: Layout
  canHandleIntent?: IntentChecker
  resolveChildForItem: ChildResolver
}

// "POJO"/verbatim-version - end result
export interface GenericList extends BaseGenericList {
  type: string
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
}

// Used internally in builder classes to make everything optional
export interface BuildableGenericList extends Partial<BaseGenericList> {
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

// Input version, allows builders and only requires things not inferrable
export interface GenericListInput extends StructureNode {
  id: string
  title: string
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
  defaultLayout?: Layout
  canHandleIntent?: IntentChecker
  resolveChildForItem?: ChildResolver
}

export abstract class GenericListBuilder<L extends BuildableGenericList> implements Serializable {
  protected intentChecker?: IntentChecker
  protected spec: L = {} as L

  id(id: string) {
    this.spec.id = id
    return this
  }

  title(title: string) {
    this.spec.title = title
    return this
  }

  defaultLayout(layout: Layout) {
    this.spec.defaultLayout = layout
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

  childResolver(resolver: ChildResolver) {
    this.spec.resolveChildForItem = resolver
    return this
  }

  canHandleIntent(checker: IntentChecker) {
    this.intentChecker = checker
    return this
  }

  serialize(options: SerializeOptions = {path: []}): GenericList {
    const id = this.spec.id || ''
    const path = options.path

    const defaultLayout = this.spec.defaultLayout
    if (defaultLayout && !layoutOptions.includes(defaultLayout)) {
      throw new SerializeError(
        `\`layout\` must be one of ${layoutOptions.map(item => `"${item}"`).join(', ')}`,
        path,
        id || options.index,
        this.spec.title
      )
    }

    return {
      id,
      title: this.spec.title,
      type: 'genericList',
      defaultLayout,
      resolveChildForItem: getSerializedChildResolver(
        this.spec.resolveChildForItem || noChildResolver
      ),
      canHandleIntent: this.intentChecker,
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, path)
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, path)
      )
    }
  }
}
