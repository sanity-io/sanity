import {UserComponent} from '../types'
import {ComponentView, ComponentViewBuilder} from './ComponentView'
import {FormView, FormViewBuilder} from './FormView'

export * from './FormView'
export * from './ComponentView'
export * from './View'

export const form = (spec?: Partial<FormView>): FormViewBuilder => new FormViewBuilder(spec)
export const component = (
  componentOrSpec?: UserComponent | Partial<ComponentView>
): ComponentViewBuilder => new ComponentViewBuilder(componentOrSpec)
