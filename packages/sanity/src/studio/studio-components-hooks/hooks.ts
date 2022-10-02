import {LayoutProps} from 'framer-motion'
import {ComponentType} from 'react'
import type {ToolMenuProps, NavbarProps, LogoProps} from '../../config'
import {useMiddlewareComponents} from '../../config/components/helpers'
import {StudioToolMenu, StudioNavbar, StudioLogo} from '../components'
import {StudioLayout} from '../StudioLayout'
import {
  pickToolMenuComponent,
  pickNavbarComponent,
  pickLogoComponent,
  pickLayoutComponent,
} from './picks'

/**
 * @internal
 */
export function useToolMenuComponent(): ComponentType<Omit<ToolMenuProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioToolMenu,
    pick: pickToolMenuComponent,
  }) as ComponentType<Omit<ToolMenuProps, 'renderDefault'>>
}

/**
 * @internal
 */
export function useNavbarComponent(): ComponentType<Omit<NavbarProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioNavbar,
    pick: pickNavbarComponent,
  }) as ComponentType<Omit<NavbarProps, 'renderDefault'>>
}

/**
 * @internal
 */
export function useLogoComponent(): ComponentType<Omit<LogoProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioLogo,
    pick: pickLogoComponent,
  }) as ComponentType<Omit<LogoProps, 'renderDefault'>>
}

/**
 * @internal
 */
export function useLayoutComponent(): ComponentType<Omit<LayoutProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    defaultComponent: StudioLayout,
    pick: pickLayoutComponent,
  }) as ComponentType<Omit<LayoutProps, 'renderDefault'>>
}
