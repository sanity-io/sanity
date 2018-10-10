import {camelCase} from 'lodash'
import {StructureNode, SerializeOptions, Serializable, Child} from './StructureNodes'
import {Layout, layoutOptions} from './Layout'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'
import {IntentChecker} from './Intent'
import {SerializeError} from './SerializeError'

function noChildResolver() {
  return undefined
}

export interface ListDisplayOptions {
  showIcons?: boolean
}

export interface BaseGenericList extends StructureNode {
  defaultLayout?: Layout
  canHandleIntent?: IntentChecker
  displayOptions?: ListDisplayOptions
  child: Child
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
  child?: Child
}

export abstract class GenericListBuilder<L extends BuildableGenericList, ConcreteImpl>
  implements Serializable {
  protected spec: L = {} as L

  id(id: string) {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  title(title: string) {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle() {
    return this.spec.title
  }

  defaultLayout(defaultLayout: Layout) {
    return this.clone({defaultLayout})
  }

  getDefaultLayout() {
    return this.spec.defaultLayout
  }

  menuItems(menuItems: (MenuItem | MenuItemBuilder)[]) {
    return this.clone({menuItems})
  }

  getMenuItems() {
    return this.spec.menuItems
  }

  menuItemGroups(menuItemGroups: (MenuItemGroup | MenuItemGroupBuilder)[]) {
    return this.clone({menuItemGroups})
  }

  getMenuItemGroups() {
    return this.spec.menuItemGroups
  }

  child(child: Child) {
    return this.clone({child})
  }

  getChild() {
    return this.spec.child
  }

  canHandleIntent(canHandleIntent: IntentChecker) {
    return this.clone({canHandleIntent})
  }

  getCanHandleIntent() {
    return this.spec.canHandleIntent
  }

  showIcons(enabled: boolean) {
    return this.clone({
      displayOptions: {...(this.spec.displayOptions || {}), showIcons: enabled}
    })
  }

  getShowIcons() {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcons : undefined
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
      child: this.spec.child || noChildResolver,
      canHandleIntent: this.spec.canHandleIntent,
      displayOptions: this.spec.displayOptions,
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, path)
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, path)
      )
    }
  }

  clone(withSpec?: object) {
    const builder = new (this.constructor as {new (): ConcreteImpl})()
    return builder
  }
}
