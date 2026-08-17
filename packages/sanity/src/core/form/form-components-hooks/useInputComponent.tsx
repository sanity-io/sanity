import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveInputComponent} from '../studio/inputResolver/inputResolver'
import {type InputProps} from '../types/inputProps'
import {pickInputComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultInput(props: Omit<InputProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<Omit<InputProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveInputComponent,
  })
}

/**
 * @internal
 */
export function useInputComponent(): ComponentType<Omit<InputProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultInput,
    pick: pickInputComponent,
  })
}
