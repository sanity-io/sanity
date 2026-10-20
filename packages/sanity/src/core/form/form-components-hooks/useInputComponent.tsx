import {type ComponentType, Suspense} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveInputComponent} from '../studio/inputResolver/inputResolver'
import {type InputProps} from '../types/inputProps'
import {CustomInputSuspenseFallback} from './CustomInputSuspenseFallback'
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

  if (!props.schemaType.components?.input) {
    return input
  }

  // A schema type's custom input can suspend on data that only settles once the document exists
  // (an SDK projection of a new document never does). Without a boundary of its own it would
  // suspend the whole form, leaving no field to edit that could create the document.
  return (
    <Suspense
      fallback={<CustomInputSuspenseFallback schemaType={props.schemaType} path={props.path} />}
    >
      {input}
    </Suspense>
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
