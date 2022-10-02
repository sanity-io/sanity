import React from 'react'
import {Tool} from '../types'

/** @beta */
// Components
export interface LayoutProps {
  renderDefault: (props: LayoutProps) => React.ReactElement
}

/** @beta */
export interface LogoProps {
  title: string
  renderDefault: (props: LogoProps) => React.ReactElement
}

/** @beta */
export interface NavbarProps {
  renderDefault: (props: NavbarProps) => React.ReactElement
}

/** @beta */
export interface ToolMenuProps {
  activeToolName?: string
  closeSidebar: () => void
  context: 'sidebar' | 'topbar'
  isSidebarOpen: boolean
  tools: Tool[]
  renderDefault: (props: ToolMenuProps) => React.ReactElement
}

/** @beta */
// Config
export interface StudioComponents {
  layout: React.ComponentType<Omit<LayoutProps, 'renderDefault'>>
  logo: React.ComponentType<Omit<LogoProps, 'renderDefault'>>
  navbar: React.ComponentType<Omit<NavbarProps, 'renderDefault'>>
  toolMenu: React.ComponentType<Omit<ToolMenuProps, 'renderDefault'>>
}

/** @beta */
export interface StudioComponentsPluginOptions {
  layout?: React.ComponentType<LayoutProps>
  logo?: React.ComponentType<LogoProps>
  navbar?: React.ComponentType<NavbarProps>
  toolMenu?: React.ComponentType<ToolMenuProps>
}
