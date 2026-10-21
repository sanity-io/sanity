import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveInputComponent} from '../studio/inputResolver/inputResolver'
import {type InputProps} from '../types/inputProps'
import {CustomComponentSuspense} from './CustomComponentSuspense'
import {pickInputComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultInput(props: Omit<InputProps, 'renderDefault'>): React.JSX.Element {
  const input = useResolveDefaultComponent<Omit<InputProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveInputComponent,
  })
  return (
    <CustomComponentSuspense slot="input" schemaType={props.schemaType} path={props.path}>
      {input}
    </CustomComponentSuspense>
  )
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
