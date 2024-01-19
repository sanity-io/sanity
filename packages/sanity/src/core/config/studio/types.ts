import {ReactElement, ComponentType} from 'react'
import {Tool} from '../types'

/**
 * @hidden
 * @beta */
// Components
export interface LayoutProps {
  renderDefault: (props: LayoutProps) => ReactElement
}

/**
 * @hidden
 * @beta */
export interface LogoProps {
  title: string
  renderDefault: (props: LogoProps) => ReactElement
}

/**
 * @hidden
 * @beta */
export interface NavbarProps {
  renderDefault: (props: NavbarProps) => ReactElement
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
  renderDefault: (props: ToolMenuProps) => ReactElement
}

/**
 * @hidden
 * @beta */
// Config
export interface StudioComponents {
  layout: ComponentType<Omit<LayoutProps, 'renderDefault'>>
  logo: ComponentType<Omit<LogoProps, 'renderDefault'>>
  navbar: ComponentType<Omit<NavbarProps, 'renderDefault'>>
  toolMenu: ComponentType<Omit<ToolMenuProps, 'renderDefault'>>
}

/**
 * @hidden
 * @beta */
export interface StudioComponentsPluginOptions {
  layout?: ComponentType<LayoutProps>
  /**
   * @deprecated Add custom icons on a per-workspace basis by customizing workspace `icon` instead.
   * @see {@link https://www.sanity.io/docs/workspaces}
   */
  logo?: ComponentType<LogoProps>
  navbar?: ComponentType<NavbarProps>
  toolMenu?: ComponentType<ToolMenuProps>
}
