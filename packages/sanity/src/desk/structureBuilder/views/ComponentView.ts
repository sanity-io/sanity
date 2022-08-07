import {startCase, camelCase} from 'lodash'
import {SerializeOptions} from '../StructureNodes'
import {SerializeError, HELP_URL} from '../SerializeError'
import {UserComponent} from '../types'
import {isRecord} from '../../../util'
import {View, GenericViewBuilder} from './View'

export interface ComponentView extends View {
  component: UserComponent
  options: Record<string, unknown>
}

const isComponentSpec = (spec: unknown): spec is ComponentView =>
  isRecord(spec) && spec.type === 'component'

export class ComponentViewBuilder extends GenericViewBuilder<
  Partial<ComponentView>,
  ComponentViewBuilder
> {
  protected spec: Partial<ComponentView>

  constructor(componentOrSpec?: UserComponent | Partial<ComponentView>) {
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

  component(component: UserComponent): ComponentViewBuilder {
    const componentName = component.displayName || component.name
    const newProps: Partial<ComponentView> = {component}
    if (componentName && !this.spec.title) {
      newProps.title = startCase(componentName)
    }
    if (componentName && !this.spec.id) {
      newProps.id = camelCase(componentName)
    }
    return this.clone(newProps)
  }

  getComponent(): Partial<ComponentView>['component'] {
    return this.spec.component
  }

  options(options: {[key: string]: any}): ComponentViewBuilder {
    return this.clone({options})
  }

  getOptions(): ComponentView['options'] {
    return this.spec.options || {}
  }

  serialize(options: SerializeOptions = {path: []}): ComponentView {
    const base = super.serialize(options)

    const component = this.spec.component
    if (typeof component !== 'function') {
      throw new SerializeError(
        '`component` is required and must be a function/class for `component()` view item',
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
