import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {StudioLayoutComponent} from '../StudioLayoutComponent'
import {pickLayoutComponent} from './picks'

/**
 * @internal
 */
export function useLayoutComponent(): ComponentType {
  return useMiddlewareComponents({
    defaultComponent: StudioLayoutComponent as ComponentType,
    pick: pickLayoutComponent,
  })
}
