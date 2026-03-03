import {type ComponentType} from 'react'

import {useMiddlewareComponents} from '../../config'
import {type ActiveToolLayoutProps, type NavbarProps, type ToolMenuProps} from '../../config/studio'
import {StudioNavbar, StudioToolMenu} from '../components'
import {StudioActiveToolLayout} from '../components/navbar/StudioActiveToolLayout'
import {StudioLayoutComponent} from '../StudioLayout'
import {
  pickActiveToolLayoutComponent,
  pickLayoutComponent,
  pickNavbarComponent,
  pickToolMenuComponent,
} from './picks'

/**
 * @internal
 */
export function useToolMenuComponent(): ComponentType<Omit<ToolMenuProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioToolMenu as ComponentType<Omit<ToolMenuProps, 'renderDefault'>>,
    pick: pickToolMenuComponent,
  })
}

/**
 * @internal
 */
export function useNavbarComponent(): ComponentType<Omit<NavbarProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioNavbar as ComponentType<Omit<NavbarProps, 'renderDefault'>>,
    pick: pickNavbarComponent,
  })
}

/**
 * @internal
 */
export function useLayoutComponent(): ComponentType {
  return useMiddlewareComponents({
    defaultComponent: StudioLayoutComponent as ComponentType,
    pick: pickLayoutComponent,
  })
}

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
