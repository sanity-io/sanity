import {SerializeOptions} from '../StructureNodes'
import {SerializeError, HELP_URL} from '../SerializeError'
import {View, GenericViewBuilder} from './View'

export interface ComponentView extends View {
  component: React.ComponentType<any>
  options: {[key: string]: any}
}

const isComponentSpec = (spec: any): spec is ComponentView => {
  return typeof spec === 'object'
}

export class ComponentViewBuilder extends GenericViewBuilder<
  Partial<ComponentView>,
  ComponentViewBuilder
> {
  protected spec: Partial<ComponentView>

  constructor(componentOrSpec?: Partial<ComponentView> | React.ComponentType<any>) {
    const spec = isComponentSpec(componentOrSpec) ? {...componentOrSpec} : {options: {}}

    super()
    this.spec = spec

    const userComponent =
      typeof componentOrSpec === 'function' ? componentOrSpec : this.spec.component

    if (userComponent) {
      // Because we're cloning, this'll return a new instance, so grab the spec from it
      this.spec = this.component(userComponent).spec
    }
  }

  component(component: React.ComponentType<any>): ComponentViewBuilder {
    return this.clone({component})
  }

  getComponent(): React.ComponentType<any> | undefined {
    return this.spec.component
  }

  options(options: {[key: string]: any}): ComponentViewBuilder {
    return this.clone({options})
  }

  getOptions(): Record<string, any> {
    return this.spec.options || {}
  }

  serialize(options: SerializeOptions = {path: []}): ComponentView {
    const base = super.serialize(options)

    const component = this.spec.component
    if (typeof component !== 'function') {
      throw new SerializeError(
        '`component` is required and must be a function for `component()` view item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.COMPONENT_REQUIRED)
    }

    return {
      ...base,
      component,
      options: this.spec.options || {},
      type: 'component',
    }
  }

  clone(withSpec?: Partial<ComponentView>): ComponentViewBuilder {
    const builder = new ComponentViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
