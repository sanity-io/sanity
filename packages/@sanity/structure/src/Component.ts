import {camelCase} from 'lodash'
import {SerializeOptions, StructureNode, Serializable, Child} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'
import {validateId} from './util/validateId'
import {FixMe} from './types'

export interface Component extends StructureNode {
  component: FixMe
  child?: Child
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  options: {[key: string]: unknown}
}

export interface ComponentInput extends StructureNode {
  component: FixMe
  child?: Child
  options?: {[key: string]: unknown}
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

export interface BuildableComponent extends Partial<StructureNode> {
  component?: FixMe
  child?: Child
  options?: {[key: string]: unknown}
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

export class ComponentBuilder implements Serializable {
  protected spec: BuildableComponent

  constructor(spec?: ComponentInput) {
    this.spec = {options: {}, ...(spec ? spec : {})}
  }

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

  child(child: Child) {
    return this.clone({child})
  }

  getChild() {
    return this.spec.child
  }

  component(component: FixMe) {
    return this.clone({component})
  }

  getComponent() {
    return this.spec.component
  }

  options(options: {[key: string]: unknown}) {
    return this.clone({options})
  }

  getOptions() {
    return this.spec.options || {}
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

  serialize(options: SerializeOptions = {path: []}): Component {
    const {id, title, child, options: componentOptions, component} = this.spec
    if (!id) {
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
      id: validateId(id, options.path, options.index),
      title,
      type: 'component',
      child,
      component,
      options: componentOptions || {},
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, options.path)
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, options.path)
      ),
    }
  }

  clone(withSpec?: BuildableComponent): ComponentBuilder {
    const builder = new ComponentBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
