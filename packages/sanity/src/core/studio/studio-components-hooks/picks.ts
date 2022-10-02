import {ComponentType} from 'react'
import {LayoutProps, LogoProps, NavbarProps, PluginOptions, ToolMenuProps} from '../../config'

export function pickToolMenuComponent(plugin: PluginOptions): ComponentType<ToolMenuProps> {
  return plugin.studio?.components?.toolMenu as ComponentType<ToolMenuProps>
}

export function pickNavbarComponent(plugin: PluginOptions): ComponentType<NavbarProps> {
  return plugin.studio?.components?.navbar as ComponentType<NavbarProps>
}

export function pickLayoutComponent(plugin: PluginOptions): ComponentType<LayoutProps> {
  return plugin.studio?.components?.layout as ComponentType<LayoutProps>
}

export function pickLogoComponent(plugin: PluginOptions): ComponentType<LogoProps> {
  return plugin.studio?.components?.logo as ComponentType<LogoProps>
}
