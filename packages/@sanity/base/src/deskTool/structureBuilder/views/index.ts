import {UserComponent} from '../types'
import {FormViewBuilder, FormView} from './FormView'
import {ComponentView, ComponentViewBuilder} from './ComponentView'

export const form = (spec?: Partial<FormView>): FormViewBuilder => new FormViewBuilder(spec)
export const component = (
  componentOrSpec?: UserComponent | Partial<ComponentView>
): ComponentViewBuilder => new ComponentViewBuilder(componentOrSpec)
