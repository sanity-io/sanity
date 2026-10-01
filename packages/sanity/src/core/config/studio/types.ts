import {type ComponentType} from 'react'

import {type Tool} from '../types'

/**
 * @hidden
 * @beta */
// Components
export interface LayoutProps {
  renderDefault: (props: LayoutProps) => React.JSX.Element
}

/**
 * Props for a `studio.components.provider` component: a middleware for the providers a plugin
 * needs across the whole studio. `StudioProvider` renders it under the studio's own providers
 * and above `StudioLayout`, so a promise created here (for example with react-rx's
 * `useObservablePromise`) and passed down through a context can be `use()`d by a `layout`,
 * `navbar` or tool, which suspends up to the studio's loading screen instead of needing a
 * boundary of its own. Keep it small and synchronous, not `lazy()`.
 *
 * @hidden
 * @beta */
export interface ProviderProps {
  renderDefault: (props: ProviderProps) => React.JSX.Element
}

/**
 * @hidden
 * @beta */
export interface LogoProps {
  title: string
  renderDefault: (props: LogoProps) => React.JSX.Element
}

interface NavbarActionBase {
  icon?: React.ComponentType
  location: 'topbar' | 'sidebar'
  name: string
}

interface ActionWithCustomRender extends NavbarActionBase {
  render: () => React.ReactElement
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
export type NavbarAction = Action | ActionWithCustomRender

/**
 * @hidden
 * @beta */
export interface NavbarProps {
  renderDefault: (props: NavbarProps) => React.JSX.Element

  /**
   * @internal
   * @beta */
  __internal_actions?: NavbarAction[]
}

/**
 * @hidden
 * @beta */
export interface ActiveToolLayoutProps {
  renderDefault: (props: ActiveToolLayoutProps) => React.JSX.Element
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
  renderDefault: (props: ToolMenuProps) => React.JSX.Element
}

/**
 * @hidden
 * @beta */
// Config
export interface StudioComponents {
  layout: ComponentType
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
  provider?: ComponentType<ProviderProps>
  toolMenu?: ComponentType<ToolMenuProps>
}
