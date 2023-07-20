import type {TFunction} from 'i18next'
import type {ComponentType} from 'react'

/**
 * An object of locale resources, or a string array of resources
 *
 * @public
 */
export type LocaleNestedResource = LocaleResourceRecord | string[]

/**
 * A locale resource key, which can be a leaf string, or a nested resource
 *
 * @public
 */
export type LocaleResourceKey = string | LocaleNestedResource

/**
 * An object of locale resources.
 *
 * @public
 */
export interface LocaleResourceRecord {
  [key: string]: LocaleResourceKey
}

/**
 * @hidden
 * @beta
 */
export interface LocaleConfigContext {
  projectId: string
  dataset: string
}

/** @beta @hidden */
export type LocalesOption =
  | ((prev: LocaleDefinition[], context: LocaleConfigContext) => LocaleDefinition[])
  | LocaleDefinition[]

/** @beta @hidden */
export type LocalesBundlesOption =
  | ((prev: LocaleResourceBundle[], context: LocaleConfigContext) => LocaleResourceBundle[])
  | LocaleResourceBundle[]

/**
 * Options that defines or adds resources to existing locales
 *
 * @beta
 * @hidden
 */
export interface LocalePluginOptions {
  /**
   * Locales available for user selection.
   *
   * Titles and icons can be changed by using a function (reducer pattern) and transforming values.
   */
  locales?: LocalesOption

  /**
   * Bundles contain "resources" (strings) that yields translations for different locales
   * throughout the studio. The strings are scoped to a specific locale and namespace.
   * Namespaces in this context usually means a specific part of the studio, like a tool or plugin.
   */
  bundles?: LocalesBundlesOption
}

/**
 * A locale resource bundle where the locale is inherited from the parent locale definition.
 *
 * @beta
 */
export type ImplicitLocaleResourceBundle = Omit<LocaleResourceBundle, 'locale'>

/**
 * A collection of locale resources for a given locale and namespace.
 * In other words, an object of translated locale strings.
 *
 * @beta
 */
export interface LocaleResourceBundle {
  /**
   * The locale ID the resources belong to, eg `en-US`, `nb-NO`, `th-TH`…
   */
  locale: string

  /**
   * The namespace the resources belong to, eg `vision`, `desk`, `studio`…
   */
  namespace: string

  /**
   * An object of locale resources, or a function that resolves to one.
   * The localization framework automatically handles ESM modules with a default export,
   * since a common use case is to dynamically load a resource file on use. This is the
   * preferred option, since it allows for lazy loading of locale resources on use.
   */
  resources:
    | LocaleResourceRecord
    | (() => Promise<LocaleResourceRecord | {default: LocaleResourceRecord}>)

  /**
   * Whether the resources should be merged deeply (eg for nested objects). Default: true
   */
  deep?: boolean

  /**
   * Whether any existing resource keys for the namespace be overwritten. Default: true
   */
  overwrite?: boolean
}

/**
 * A locale definition, which describes a locale and its resources.
 *
 * @beta
 */
export interface LocaleDefinition {
  /**
   * The ID of the locale, eg `en-US`, `nb-NO`, `th-TH`…
   */
  id: string

  /**
   * The title of locale, eg `English (US)`, `Norsk (bokmål)`, `ไทย`…
   */
  title: string

  /**
   * React component representing the icon of the locale, generally a flag.
   */
  icon?: ComponentType

  /**
   * Array of resource bundles for this locale, if any.
   *
   * Generally you'll want to provide some base resources, eg for the studio core namespace,
   * as well as for common namespaces like `desk` and `vision`. You can also provide resources
   * for other plugins/namespaces - but preferably the resources should be provided as an async
   * function that imports the resources, in order to lazy load them on use.
   */
  bundles?: (ImplicitLocaleResourceBundle | LocaleResourceBundle)[]

  // @todo allow fallback locales? eg [no-nn, no-nb, en]
}

/** @internal */
export interface LocaleSource {
  /**
   * Current locale ID (eg `en-US`, `nb-NO`, `th-TH`…)
   */
  currentLocale: string

  /**
   * Array of locale definitions
   */
  locales: Pick<LocaleDefinition, 'id' | 'title'>[]

  /**
   * Translation function, eg `t('some.key') => 'Some string'`
   */
  t: TFunction
}

export type {TFunction}

export type {StudioLocaleResourceKeys} from './bundles/studio'
