import type {InitOptions, ResourceLanguage} from 'i18next'
import React from 'react'
import {ConfigContext, LanguageLoader, Tool} from '../types'

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
  logo?: React.ComponentType<LogoProps>
  navbar?: React.ComponentType<NavbarProps>
  toolMenu?: React.ComponentType<ToolMenuProps>
}

/** @alpha */
export interface I18nContext {
  projectId: string
  dataset: string
}

/** @alpha */
export interface LanguageResource {
  namespace: string
  resources: ResourceLanguage
}

/** @alpha */
export interface I18nPluginOptions {
  initOptions?: (options: InitOptions, context: I18nContext) => InitOptions
  languageLoaders?:
    | ((prev: LanguageLoader[], context: I18nContext) => LanguageLoader[])
    | LanguageLoader[]
}
