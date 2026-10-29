import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveFieldComponent} from '../studio/inputResolver/fieldResolver'
import {type FieldProps} from '../types/fieldProps'
import {pickFieldComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultField(props: Omit<FieldProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<Omit<FieldProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveFieldComponent,
  })
}

/**
 * @internal
 */
export function useFieldComponent(): ComponentType<Omit<FieldProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultField,
    pick: pickFieldComponent,
  })
}
