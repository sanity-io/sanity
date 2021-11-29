import type {FixMe} from '../types'
import type {FormView} from './FormView'
import {FormViewBuilder} from './FormView'
import type {ComponentView} from './ComponentView'
import {ComponentViewBuilder} from './ComponentView'

export const form = (spec?: Partial<FormView>) => new FormViewBuilder(spec)
export const component = (componentOrSpec?: FixMe | Partial<ComponentView>) =>
  new ComponentViewBuilder(componentOrSpec)
