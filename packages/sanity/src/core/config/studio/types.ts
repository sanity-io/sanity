import type {InitOptions, ResourceLanguage} from 'i18next'
import React from 'react'
import {ConfigContext, LanguageDefinition, LanguageLoader, Tool} from '../types'

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
export interface LanguageBundle {
  namespace: string
  resources: ResourceLanguage
  /** Should the resources be merged deeply (nested objects). Default: true */
  deep?: boolean
  /** Should existing resource keys for the namespace be overwritten. Default: false */
  overwrite?: boolean
}

/** @alpha */
export type I18nLanguagesOption =
  | ((prev: LanguageDefinition[], context: I18nContext) => LanguageDefinition[])
  | LanguageDefinition[]

/** @alpha */
export type I18nLanguageLoaderOption =
  | ((prev: LanguageLoader[], context: I18nContext) => LanguageLoader[])
  | LanguageLoader[]

/** @alpha */
export interface I18nPluginOptions {
  /**
   * Defines which languages should be available for user selection.
   * Prev is initially `[{id: 'en-US', title: 'English (US)', icon: AmericanFlag }]`
   *
   * Language titles and icons can be changed by transforming the LanguageDefinition array values.
   *
   * User selected language
   */
  languages?: I18nLanguagesOption

  /**
   * Allows redefining the I18next init options before they are used.
   * Invoked when a workspace is loaded
   */
  initOptions?: (options: InitOptions, context: I18nContext) => InitOptions

  /**
   * Defines language bundles that will be loaded lazily.
   *
   * ### Example
   *
   * ```ts
   *
   * ```
   *
   */
  languageLoaders?: I18nLanguageLoaderOption

  /**
   * When this is true, schema type title and descriptions will be translated.
   * Configure a languageLoader that returns a language bundle for the `schema` namespace,
   * with resource keys using the following convention:
   *
   * ## Keys for types
   * - `<typeName>|title`
   * - `<typeName>|description`
   *
   * ## Keys for fields
   *
   * -`<objectTypeName>.<fieldName>|title`
   * -`<objectTypeName>.<fieldName>|description`
   *
   * ## Keys for array items
   *
   * - `<arrayTypeName>.<arrayMemberTypeName>|title`
   * - `<arrayTypeName>.<arrayMemberTypeName>|description`
   *
   * ## Caveats
   *
   * Enabling schema translations could adversely impact studio performance.
   * Inline definitions for objects are not supported (nested types).
   *
   * ## Example LanguageBundle
   *
   *```ts
   * // locales/en_US/schema.ts
   * export default {
   *   namespace: 'schema',
   *   resources: {
   *     'myDocumentType|title': 'Document type 'myDocumentType' will use this string as title wherever it is used',
   *
   *     'myDocumentType.text|title': 'Document field named 'text' will use this string as title'
   *     'myDocumentType.text|description': 'Document field named 'text' will this string as description',
   *   },
   *  }
   *```
   *
   */
  experimentalTranslateSchemas?: boolean
}
