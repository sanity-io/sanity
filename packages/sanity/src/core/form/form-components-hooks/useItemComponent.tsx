import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveItemComponent} from '../studio/inputResolver/itemResolver'
import {type ItemProps} from '../types/itemProps'
import {pickItemComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
export function DefaultItem(props: Omit<ItemProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<Omit<ItemProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveItemComponent,
  })
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
