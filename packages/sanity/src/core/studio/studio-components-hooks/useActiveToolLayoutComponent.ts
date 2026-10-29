import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {type ActiveToolLayoutProps} from '../../config/studio/types'
import {StudioActiveToolLayout} from '../components/navbar/StudioActiveToolLayout'
import {pickActiveToolLayoutComponent} from './picks'

/**
 * @internal
 */
export function useActiveToolLayoutComponent(): ComponentType<
  Omit<ActiveToolLayoutProps, 'renderDefault'>
> {
  return useMiddlewareComponents({
    defaultComponent: StudioActiveToolLayout as ComponentType<
      Omit<ActiveToolLayoutProps, 'renderDefault'>
    >,
    pick: pickActiveToolLayoutComponent,
  })
}
