import {kebabCase} from 'lodash'
import {View, ViewBuilder} from './View'
import {SerializeOptions} from '../StructureNodes'
import {SerializeError, HELP_URL} from '../SerializeError'

interface ReactComponent extends Function {
  displayName?: string
}

function getFunctionName(fn: ReactComponent) {
  return typeof fn.displayName === 'string' ? fn.displayName : fn.name
}

export interface ComponentView extends View {
  component: Function
}

const isComponentSpec = (spec: any): spec is ComponentView => {
  return typeof spec === 'object'
}

export class ComponentViewBuilder extends ViewBuilder {
  protected spec: Partial<ComponentView>

  constructor(componentOrSpec?: Function | Partial<ComponentView>) {
    const spec = isComponentSpec(componentOrSpec) ? componentOrSpec : {}

    super(spec)
    this.spec = spec

    const userComponent =
      typeof componentOrSpec === 'function' ? componentOrSpec : this.spec.component

    if (userComponent) {
      // Because we're cloning, this'll return a new instance, so grab the spec from it
      this.spec = this.component(userComponent).spec
    }
  }

  component(component: Function) {
    return this.clone({
      component,
      id: this.spec.id || kebabCase(getFunctionName(component)),
      title: this.spec.title || getFunctionName(component)
    })
  }

  getComponent() {
    return this.spec.component
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
      type: 'component'
    }
  }

  clone(withSpec?: Partial<ComponentView>): ComponentViewBuilder {
    const builder = new ComponentViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
