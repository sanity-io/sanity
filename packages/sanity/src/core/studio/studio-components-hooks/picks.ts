import {type ComponentType} from 'react'

import {
  type LayoutProps,
  type LogoProps,
  type NavbarProps,
  type PluginOptions,
  type ToolMenuProps,
} from '../../config'

export function pickToolMenuComponent(
  plugin: PluginOptions,
): ComponentType<Omit<ToolMenuProps, 'renderDefault'>> {
  return plugin.studio?.components?.toolMenu as ComponentType<Omit<ToolMenuProps, 'renderDefault'>>
}

export function pickNavbarComponent(
  plugin: PluginOptions,
): ComponentType<Omit<NavbarProps, 'renderDefault'>> {
  return plugin.studio?.components?.navbar as ComponentType<Omit<NavbarProps, 'renderDefault'>>
}

export function pickLayoutComponent(
  plugin: PluginOptions,
): ComponentType<Omit<LayoutProps, 'renderDefault'>> {
  return plugin.studio?.components?.layout as ComponentType<Omit<LayoutProps, 'renderDefault'>>
}

export function pickLogoComponent(
  plugin: PluginOptions,
): ComponentType<Omit<LogoProps, 'renderDefault'>> {
  return plugin.studio?.components?.logo as ComponentType<Omit<LogoProps, 'renderDefault'>>
}
