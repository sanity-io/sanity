import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveFieldComponent} from '../studio/inputResolver/fieldResolver'
import {type FieldProps} from '../types/fieldProps'
import {CustomComponentSuspense} from './CustomComponentSuspense'
import {pickFieldComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultField(props: Omit<FieldProps, 'renderDefault'>): React.JSX.Element {
  const field = useResolveDefaultComponent<Omit<FieldProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveFieldComponent,
  })
  return (
    <CustomComponentSuspense slot="field" schemaType={props.schemaType} path={props.path}>
      {field}
    </CustomComponentSuspense>
  )
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
