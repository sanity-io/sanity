import {SerializeOptions} from '../StructureNodes'
import {SerializeError, HELP_URL} from '../SerializeError'
import type {UserViewComponent} from '../types'
import {BaseView, GenericViewBuilder} from './View'
import {isRecord} from 'sanity'

/**
 * Interface for component views.
 *
 * @public */
export interface ComponentView<TOptions = Record<string, any>> extends BaseView {
  type: 'component'
  /** Component view components */
  component: UserViewComponent
  /** Component view options */
  options: TOptions
}

const isComponentSpec = (spec: unknown): spec is ComponentView =>
  isRecord(spec) && spec.type === 'component'

/**
 * Class for building a component view.
 *
 * @public */
export class ComponentViewBuilder extends GenericViewBuilder<
  Partial<ComponentView>,
  ComponentViewBuilder
> {
  protected spec: Partial<ComponentView>

  constructor(componentOrSpec?: UserViewComponent | Partial<ComponentView>) {
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

  /** Set view Component
   * @returns component view builder based on component view provided
   */
  component(component: UserViewComponent): ComponentViewBuilder {
    return this.clone({component})
  }

  /** Get view Component
   * @returns component view component
   */
  getComponent(): Partial<ComponentView>['component'] {
    return this.spec.component
  }

  /** Set view Component options
   * @returns component view builder based on options provided
   */
  options(options: {[key: string]: any}): ComponentViewBuilder {
    return this.clone({options})
  }

  /** Get view Component options
   * @returns component view options
   */
  getOptions(): ComponentView['options'] {
    return this.spec.options || {}
  }

  /** Serialize view Component
   * @returns component view based on path provided in options
   *
   */
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

  /** Clone Component view builder (allows for options overriding)
   * @returns component view builder
   */
  clone(withSpec?: Partial<ComponentView>): ComponentViewBuilder {
    const builder = new ComponentViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
