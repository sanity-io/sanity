import type {InitOptions, TFunction, i18n} from 'i18next'
import type {ComponentType} from 'react'

/**
 * An object of language resources, or a string array of resources
 *
 * @public
 */
export type I18nNestedResource = I18nResourceRecord | string[]

/**
 * A language resource key, which can be a leaf string, or a nested resource
 *
 * @public
 */
export type I18nResourceKey = string | I18nNestedResource

/**
 * An object of language resources.
 *
 * @public
 */
export interface I18nResourceRecord {
  [key: string]: I18nResourceKey
}

/**
 * @hidden
 * @beta
 */
export interface I18nContext {
  projectId: string
  dataset: string
}

/**
 * A language resource bundle where the language is inherited from the parent language definition.
 *
 * @beta
 */
export type ImplicitLanguageResourceBundle = Omit<LanguageResourceBundle, 'language'>

/**
 * A bundle of language resources for a given language and namespace.
 *
 * @beta
 */
export interface LanguageResourceBundle {
  language: string
  namespace: string
  resources:
    | I18nResourceRecord
    | (() => Promise<I18nResourceRecord | {default: I18nResourceRecord}>)

  /** Should the resources be merged deeply (nested objects). Default: true */
  deep?: boolean

  /** Should existing resource keys for the namespace be overwritten. Default: false */
  overwrite?: boolean
}

/** @beta @hidden */
export type I18nLanguagesOption =
  | ((prev: LanguageDefinition[], context: I18nContext) => LanguageDefinition[])
  | LanguageDefinition[]

/** @beta @hidden */
export type I18nResourceBundlesOption =
  | ((prev: LanguageResourceBundle[], context: I18nContext) => LanguageResourceBundle[])
  | LanguageResourceBundle[]

/** @beta @hidden */
export interface I18nPluginOptions {
  /**
   * Defines which languages should be available for user selection.
   * Prev is initially `[{id: 'en-US', title: 'English (US)', icon: AmericanFlag }]`
   *
   * Language titles and icons can be changed by transforming the LanguageDefinition array values.
   */
  languages?: I18nLanguagesOption

  /**
   * Bundles contain "resources" (strings) that yields translations for different languages
   * throughout the studio. The strings are scoped to a specific language and namespace.
   * Namespaces in this context usually means a specific part of the studio, like a tool or plugin.
   */
  bundles?: I18nResourceBundlesOption

  /**
   * Allows redefining the I18next init options before they are used.
   * Invoked when a workspace is loaded
   */
  initOptions?: (options: InitOptions, context: I18nContext) => InitOptions
}

/** @beta @hidden */
export interface LanguageDefinition {
  id: string
  title: string
  icon?: ComponentType
  bundles?: (ImplicitLanguageResourceBundle | LanguageResourceBundle)[]
  // @todo allow fallback languages? eg [no-nn, no-nb, en]
}

/** @internal */
export interface I18nSource {
  languages: LanguageDefinition[]
  initOptions: InitOptions
  t: TFunction
  i18next: i18n
}

export type {I18nStudioResourceKeys} from './bundles/studio'
