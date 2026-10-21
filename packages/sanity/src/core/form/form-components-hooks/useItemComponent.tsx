import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveItemComponent} from '../studio/inputResolver/itemResolver'
import {type ItemProps} from '../types/itemProps'
import {CustomComponentSuspense} from './CustomComponentSuspense'
import {pickItemComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultItem(props: Omit<ItemProps, 'renderDefault'>): React.JSX.Element {
  const item = useResolveDefaultComponent<Omit<ItemProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveItemComponent,
  })
  return (
    <CustomComponentSuspense slot="item" schemaType={props.schemaType} path={props.path}>
      {item}
    </CustomComponentSuspense>
  )
}

/**
 * @internal
 */
export function useItemComponent(): ComponentType<Omit<ItemProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultItem,
    pick: pickItemComponent,
  })
}
