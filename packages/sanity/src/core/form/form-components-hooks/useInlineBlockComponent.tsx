import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveInlineBlockComponent} from '../studio/inputResolver/blockResolver'
import {type BlockProps} from '../types/blockProps'
import {pickInlineBlockComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultInlineBlock(props: Omit<BlockProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<Omit<BlockProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveInlineBlockComponent,
  })
}

/**
 * @internal
 */
export function useInlineBlockComponent(): ComponentType<Omit<BlockProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: DefaultInlineBlock,
    pick: pickInlineBlockComponent,
  })
}
