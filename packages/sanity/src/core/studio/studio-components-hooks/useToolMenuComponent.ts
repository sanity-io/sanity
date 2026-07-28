import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {type ToolMenuProps} from '../../config/studio/types'
import {StudioToolMenu} from '../components/navbar/tools/StudioToolMenu'
import {pickToolMenuComponent} from './picks'

/**
 * @internal
 */
export function useToolMenuComponent(): ComponentType<Omit<ToolMenuProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioToolMenu as ComponentType<Omit<ToolMenuProps, 'renderDefault'>>,
    pick: pickToolMenuComponent,
  })
}
