import React from 'react'
import {Tool} from '../../types'

export type StudioComponentNames = 'Layout' | 'Logo' | 'Navbar' | 'ToolMenu'

export type RenderComponentCallbackNames =
  | 'renderLayout'
  | 'renderLogo'
  | 'renderNavbar'
  | 'renderToolMenu'

// Components
export interface LayoutProps {
  renderLayout: (props: LayoutProps) => React.ReactElement
}

export interface LogoProps {
  title: string
  renderLogo: (props: LogoProps) => React.ReactElement
}

export interface NavbarProps {
  renderNavbar: (props: NavbarProps) => React.ReactElement
}

export interface ToolMenuProps {
  activeToolName?: string
  closeSidebar: () => void
  context: 'sidebar' | 'topbar'
  isSidebarOpen: boolean
  tools: Tool[]
  renderToolMenu: (props: ToolMenuProps) => React.ReactElement
}

// Config
export interface StudioComponents {
  Layout: React.ComponentType<Omit<LayoutProps, 'renderLayout'>>
  Logo: React.ComponentType<Omit<LogoProps, 'renderLogo'>>
  Navbar: React.ComponentType<Omit<NavbarProps, 'renderNavbar'>>
  ToolMenu: React.ComponentType<Omit<ToolMenuProps, 'renderToolMenu'>>
}

export interface StudioComponentsPluginOptions {
  Layout?: React.ComponentType<LayoutProps>
  Logo?: React.ComponentType<LogoProps>
  Navbar?: React.ComponentType<NavbarProps>
  ToolMenu?: React.ComponentType<ToolMenuProps>
}
