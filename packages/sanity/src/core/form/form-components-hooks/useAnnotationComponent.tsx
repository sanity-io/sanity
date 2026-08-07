import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {defaultResolveAnnotationComponent} from '../studio/inputResolver/blockResolver'
import {type BlockAnnotationProps} from '../types/blockProps'
import {pickAnnotationComponent} from './picks'
import {useResolveDefaultComponent} from './useResolveDefaultComponent'

/**
 * @internal
 */
function DefaultAnnotation(props: Omit<BlockAnnotationProps, 'renderDefault'>): React.JSX.Element {
  return useResolveDefaultComponent<Omit<BlockAnnotationProps, 'renderDefault'>>({
    componentProps: props,
    componentResolver: defaultResolveAnnotationComponent,
  })
}

/**
 * @internal
 */
export function useAnnotationComponent(): ComponentType<
  Omit<BlockAnnotationProps, 'renderDefault'>
> {
  return useMiddlewareComponents({
    defaultComponent: DefaultAnnotation,
    pick: pickAnnotationComponent,
  })
}
