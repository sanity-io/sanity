import type {UserViewComponent} from '../types'
import {ComponentView, ComponentViewBuilder} from './ComponentView'
import {FormView, FormViewBuilder} from './FormView'

export * from './FormView'
export * from './ComponentView'
export * from './View'

/** @internal */
export const form = (spec?: Partial<FormView>): FormViewBuilder => new FormViewBuilder(spec)

/** @internal */
export const component = (
  componentOrSpec?: UserViewComponent | Partial<ComponentView>
): ComponentViewBuilder => new ComponentViewBuilder(componentOrSpec)
