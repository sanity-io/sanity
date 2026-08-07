import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveBlockComponent} from '../studio/inputResolver/blockResolver'
import {type BlockProps} from '../types/blockProps'
import {pickBlockComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
export function DefaultBlock(props: Omit<BlockProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<Omit<BlockProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveBlockComponent,
  })
}

/**
 * @internal
 */
export function useBlockComponent(): ComponentType<Omit<BlockProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultBlock,
    pick: pickBlockComponent,
  })
}
