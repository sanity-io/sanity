import {FixMe} from '../types'
import {FormViewBuilder, FormView} from './FormView'
import {ComponentView, ComponentViewBuilder} from './ComponentView'

export const form = (spec?: Partial<FormView>) => new FormViewBuilder(spec)
export const component = (componentOrSpec?: FixMe | Partial<ComponentView>) =>
  new ComponentViewBuilder(componentOrSpec)
