import {FormViewBuilder, FormView} from './FormView'
import {ComponentView, ComponentViewBuilder} from './ComponentView'

export const form = (spec?: Partial<FormView>) => new FormViewBuilder(spec)
export const component = (componentOrSpec?: Function | Partial<ComponentView>) =>
  new ComponentViewBuilder(componentOrSpec)
