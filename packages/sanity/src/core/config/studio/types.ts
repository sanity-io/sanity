import React, {type ComponentType, type ReactElement} from 'react';

import {type Tool} from '../types'

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

interface NavbarActionBase {
  icon?: React.ComponentType
  location: 'topbar' | 'sidebar'
  name: string
}

interface TopbarActionWithCustomRender extends NavbarActionBase {
  location: 'topbar'
  render: () => ReactElement
}

interface Action extends NavbarActionBase {
  onAction: () => void
  selected: boolean
  title: string
  render?: undefined
}

/**
 * @internal
 * @beta
 * An internal API for defining actions in the navbar.
 */
export type NavbarAction = Action | TopbarActionWithCustomRender

/**
 * @hidden
 * @beta */
export interface NavbarProps {
  renderDefault: (props: NavbarProps) => ReactElement

  /**
   * @internal
   * @beta */
  __internal_actions?: NavbarAction[]
}

/**
 * @hidden
 * @beta */
export interface ActiveToolLayoutProps {
  renderDefault: (props: ActiveToolLayoutProps) => React.ReactElement
  activeTool: Tool
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
  /**
   * @deprecated Add custom icons on a per-workspace basis by customizing workspace `icon` instead.
   * @see {@link https://www.sanity.io/docs/workspaces}
   */
  logo: ComponentType<Omit<LogoProps, 'renderDefault'>>
  navbar: ComponentType<Omit<NavbarProps, 'renderDefault'>>
  toolMenu: ComponentType<Omit<ToolMenuProps, 'renderDefault'>>
}

/**
 * @hidden
 * @beta */
export interface StudioComponentsPluginOptions {
  activeToolLayout?: ComponentType<ActiveToolLayoutProps>
  layout?: ComponentType<LayoutProps>
  /**
   * @deprecated Add custom icons on a per-workspace basis by customizing workspace `icon` instead.
   * @see {@link https://www.sanity.io/docs/workspaces}
   */
  logo?: ComponentType<LogoProps>
  navbar?: ComponentType<NavbarProps>
  toolMenu?: ComponentType<ToolMenuProps>
}
