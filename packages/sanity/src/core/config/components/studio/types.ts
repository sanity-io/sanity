import React from 'react'
import {Tool} from '../../types'

/** @internal */
export type ComponentNames = 'Layout' | 'Logo' | 'Navbar' | 'ToolMenu'

/** @internal */
export type RenderComponentCallbackNames =
  | 'renderLayout'
  | 'renderLogo'
  | 'renderNavbar'
  | 'renderToolMenu'

/** @beta */
export interface LayoutProps {
  renderLayout: (props: LayoutProps) => React.ReactElement
}

/** @beta */
export interface LogoProps {
  title: string
  renderLogo: (props: LogoProps) => React.ReactElement
}

/** @beta */
export interface NavbarProps {
  renderNavbar: (props: NavbarProps) => React.ReactElement
}

/** @beta */
export interface ToolMenuProps {
  activeToolName?: string
  closeSidebar: () => void
  context: 'sidebar' | 'topbar'
  isSidebarOpen: boolean
  tools: Tool[]
  renderToolMenu: (props: ToolMenuProps) => React.ReactElement
}

/** @beta */
export interface StudioComponents {
  Layout: React.ComponentType<Omit<LayoutProps, 'renderLayout'>>
  Logo: React.ComponentType<Omit<LogoProps, 'renderLogo'>>
  Navbar: React.ComponentType<Omit<NavbarProps, 'renderNavbar'>>
  ToolMenu: React.ComponentType<Omit<ToolMenuProps, 'renderToolMenu'>>
}

/** @beta */
export interface StudioComponentsPluginOptions {
  Layout?: React.ComponentType<LayoutProps>
  Logo?: React.ComponentType<LogoProps>
  Navbar?: React.ComponentType<NavbarProps>
  ToolMenu?: React.ComponentType<ToolMenuProps>
}
