import {FormViewBuilder} from './FormView'
import {ComponentView, ComponentViewBuilder} from './ComponentView'
import {View} from './View'

export const form = (spec?: Partial<View>) => new FormViewBuilder(spec)
export const component = (componentOrSpec?: React.ComponentType<any> | Partial<ComponentView>) =>
  new ComponentViewBuilder(componentOrSpec)
