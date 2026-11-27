import {type UserViewComponent} from '../types'
import {type ComponentView, ComponentViewBuilder} from './ComponentView'
import {type FormView, FormViewBuilder} from './FormView'

export {type ComponentView, ComponentViewBuilder} from './ComponentView'
export {type FormView, FormViewBuilder} from './FormView'
export {type BaseView, GenericViewBuilder, maybeSerializeView, type ViewBuilder} from './View'

/**
 * @hidden
 * @beta
 */
export const form = (spec?: Partial<FormView>): FormViewBuilder => new FormViewBuilder(spec)

/**
 * @hidden
 * @beta
 */
export const component = (
  componentOrSpec?: UserViewComponent | Partial<ComponentView>,
): ComponentViewBuilder => new ComponentViewBuilder(componentOrSpec)
