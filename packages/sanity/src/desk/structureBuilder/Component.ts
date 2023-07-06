import {SerializeOptions, StructureNode, Serializable, Child} from './StructureNodes'
import {SerializeError, HELP_URL} from './SerializeError'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'
import {validateId} from './util/validateId'
import {UserComponent} from './types'
import {getStructureNodeId} from './util/getStructureNodeId'

/**
 * @hidden
 * @beta */
// TODO: rename to `StructureComponent` since it clashes with React?
export interface Component extends StructureNode {
  component: UserComponent
  child?: Child
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  options: {[key: string]: unknown}
}

/**
 * @hidden
 * @beta */
export interface ComponentInput extends StructureNode {
  component: UserComponent
  child?: Child
  options?: {[key: string]: unknown}
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

/**
 * @hidden
 * @beta */
export interface BuildableComponent extends Partial<StructureNode> {
  component?: UserComponent
  child?: Child
  options?: {[key: string]: unknown}
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

/**
 * @hidden
 * @beta */
export class ComponentBuilder implements Serializable<Component> {
  protected spec: BuildableComponent

  constructor(spec?: ComponentInput) {
    this.spec = {options: {}, ...(spec ? spec : {})}
  }

  id(id: string): ComponentBuilder {
    return this.clone({id})
  }

  getId(): BuildableComponent['id'] {
    return this.spec.id
  }

  title(title: string): ComponentBuilder {
    return this.clone({title, id: getStructureNodeId(title, this.spec.id)})
  }

  getTitle(): BuildableComponent['title'] {
    return this.spec.title
  }

  child(child: Child): ComponentBuilder {
    return this.clone({child})
  }

  getChild(): BuildableComponent['child'] {
    return this.spec.child
  }

  component(component: UserComponent): ComponentBuilder {
    return this.clone({component})
  }

  getComponent(): BuildableComponent['component'] {
    return this.spec.component
  }

  options(options: {[key: string]: unknown}): ComponentBuilder {
    return this.clone({options})
  }

  getOptions(): NonNullable<BuildableComponent['options']> {
    return this.spec.options || {}
  }

  menuItems(menuItems: (MenuItem | MenuItemBuilder)[]): ComponentBuilder {
    return this.clone({menuItems})
  }

  getMenuItems(): BuildableComponent['menuItems'] {
    return this.spec.menuItems
  }

  menuItemGroups(menuItemGroups: (MenuItemGroup | MenuItemGroupBuilder)[]): ComponentBuilder {
    return this.clone({menuItemGroups})
  }

  getMenuItemGroups(): BuildableComponent['menuItemGroups'] {
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
