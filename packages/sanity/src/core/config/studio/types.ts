import React from 'react'
import {Tool} from '../types'

/**
 * @hidden
 * @beta */
// Components
export interface LayoutProps {
  renderDefault: (props: LayoutProps) => React.ReactElement
}

/**
 * @hidden
 * @beta */
export interface LogoProps {
  title: string
  renderDefault: (props: LogoProps) => React.ReactElement
}

/**
 * @hidden
 * @beta */
export interface NavbarProps {
  renderDefault: (props: NavbarProps) => React.ReactElement
}

/**
 * @hidden
 * @beta */
export interface ToolMenuProps {
  activeToolName?: string
  closeSidebar: () => void
  context: 'sidebar' | 'topbar'
  isSidebarOpen: boolean
  tools: Tool[]
  renderDefault: (props: ToolMenuProps) => React.ReactElement
}

/**
 * @hidden
 * @beta */
// Config
export interface StudioComponents {
  layout: React.ComponentType<Omit<LayoutProps, 'renderDefault'>>
  logo: React.ComponentType<Omit<LogoProps, 'renderDefault'>>
  navbar: React.ComponentType<Omit<NavbarProps, 'renderDefault'>>
  toolMenu: React.ComponentType<Omit<ToolMenuProps, 'renderDefault'>>
}

/**
 * @hidden
 * @beta */
export interface StudioComponentsPluginOptions {
  layout?: React.ComponentType<LayoutProps>
  /** @deprecated Use logoMark instead */
  logo?: React.ComponentType<LogoProps>
  navbar?: React.ComponentType<NavbarProps>
  toolMenu?: React.ComponentType<ToolMenuProps>
}
