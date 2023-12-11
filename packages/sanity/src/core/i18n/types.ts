import type {TFunction} from 'i18next'

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
 * Context passed to locale config resolvers
 *
 * @public
 */
export interface LocaleConfigContext {
  projectId: string
  dataset: string
}

/**
 * Either an array of locale definitions, or a resolver that returns one.
 *
 * @public
 */
export type LocalesOption =
  | ((prev: LocaleDefinition[], context: LocaleConfigContext) => LocaleDefinition[])
  | LocaleDefinition[]

/**
 * Either an array of locale resource bundles, or a resolver that returns one.
 *
 * @public
 */
export type LocalesBundlesOption =
  | ((prev: LocaleResourceBundle[], context: LocaleConfigContext) => LocaleResourceBundle[])
  | LocaleResourceBundle[]

/**
 * Options that defines or adds resources to existing locales
 *
 * @public
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
 * @public
 */
export type ImplicitLocaleResourceBundle = Omit<LocaleResourceBundle, 'locale'>

/**
 * A collection of locale resources for a given locale and namespace.
 * In other words, an object of translated locale strings.
 *
 * @public
 */
export interface LocaleResourceBundle {
  /**
   * The locale ID the resources belong to, eg `en-US`, `nb-NO`, `th-TH`…
   */
  locale: string

  /**
   * The namespace the resources belong to, eg `vision`, `structure`, `studio`…
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
 * A locale resource bundle where the resources are static, eg not lazy loaded.
 *
 * @public
 */
export type StaticLocaleResourceBundle = Omit<ImplicitLocaleResourceBundle, 'resources'> & {
  /**
   * The locale ID the resources belong to, eg `en-US`, `nb-NO`, `th-TH`…
   */
  locale?: string

  /**
   * An object of locale resources.
   */
  resources: LocaleResourceRecord
}

/**
 * A locale representation
 *
 * @public
 */
export interface Locale {
  /**
   * The ID of the locale, eg `en-US`, `nb-NO`, `th-TH`…
   */
  id: string

  /**
   * The title of locale, eg `English (US)`, `Norsk (bokmål)`, `ไทย`…
   */
  title: string

  /**
   * Week information for this locale. Based on the `Intl.Locale['weekInfo']` type.
   */
  weekInfo: LocaleWeekInfo
}

/**
 * An object representing week information associated with the Locale data specified in
 * {@link https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Patterns_Week_Elements | UTS 35's Week Elements }
 *
 * @public
 */
export interface LocaleWeekInfo {
  /**
   * An integer indicating the first day of the week for the locale. Can be either 1 (Monday) or 7 (Sunday).
   */
  firstDay: 1 | 7

  /**
   * An array of integers indicating the weekend days for the locale, where 1 is Monday and 7 is Sunday.
   */
  weekend: (1 | 2 | 3 | 4 | 5 | 6 | 7)[]

  /**
   * An integer between 1 and 7 indicating the minimal days required in the first week of a month or year, for calendar purposes.
   */
  minimalDays: 1 | 2 | 3 | 4 | 5 | 6 | 7
}

/**
 * A locale definition, which describes a locale and its resources.
 *
 * @public
 */
export interface LocaleDefinition extends Locale {
  /**
   * Array of resource bundles for this locale, if any.
   *
   * Generally you'll want to provide some base resources, eg for the studio core namespace,
   * as well as for common namespaces like `desk` and `vision`. You can also provide resources
   * for other plugins/namespaces - but preferably the resources should be provided as an async
   * function that imports the resources, in order to lazy load them on use.
   */
  bundles?: (ImplicitLocaleResourceBundle | LocaleResourceBundle)[]
}

/**
 * Internal representation of the available locale configuration.
 *
 * Generally not something you will want to use directly.
 *
 * @public
 */
export interface LocaleSource {
  /**
   * Current locale ID (eg `en-US`, `nb-NO`, `th-TH`…)
   */
  currentLocale: Locale

  /**
   * Array of locale definitions
   */
  locales: Locale[]

  /**
   * Loads the given namespaces, if not already done.
   *
   * @param namespaces - Array of namespace names to load
   * @returns Promise which resolves once loaded.
   */
  loadNamespaces(namespaces: string[]): Promise<void>

  /**
   * Translation function, eg `t('some.key') => 'Some string'`
   */
  t: TFunction
}

export type {TFunction}

export type {StudioLocaleResourceKeys} from './bundles/studio'
export type {ValidationLocaleResourceKeys} from './bundles/validation'
