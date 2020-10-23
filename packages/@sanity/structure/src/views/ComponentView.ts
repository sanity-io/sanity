import {View, GenericViewBuilder} from './View'
import {SerializeOptions} from '../StructureNodes'
import {SerializeError, HELP_URL} from '../SerializeError'

export interface ComponentView extends View {
  component: Function
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

  constructor(componentOrSpec?: Function | Partial<ComponentView>) {
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

  component(component: Function) {
    return this.clone({component})
  }

  getComponent() {
    return this.spec.component
  }

  options(options: {[key: string]: any}) {
    return this.clone({options})
  }

  getOptions() {
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
