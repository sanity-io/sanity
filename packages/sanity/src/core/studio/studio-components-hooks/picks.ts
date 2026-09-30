import {type ComponentType, type ReactNode} from 'react'

import {
  type ActiveToolLayoutProps,
  type NavbarProps,
  type ToolMenuProps,
} from '../../config/studio/types'
import {type PluginOptions} from '../../config/types'

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

export function pickLayoutComponent(plugin: PluginOptions): ComponentType {
  return plugin.studio?.components?.layout as ComponentType
}

export function pickProviderComponent(plugin: PluginOptions): ComponentType<{children: ReactNode}> {
  // The chain is rendered with `children`; a plugin's component only sees `renderDefault`.
  return plugin.studio?.components?.provider as unknown as ComponentType<{children: ReactNode}>
}

export function pickActiveToolLayoutComponent(
  plugin: PluginOptions,
): ComponentType<Omit<ActiveToolLayoutProps, 'renderDefault'>> {
  return plugin.studio?.components?.activeToolLayout as ComponentType<
    Omit<ActiveToolLayoutProps, 'renderDefault'>
  >
}
