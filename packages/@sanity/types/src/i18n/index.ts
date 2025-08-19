import {type TFunction} from 'i18next'

/**
 * An object representing week information associated with the Locale data specified in
 * {@link https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Patterns_Week_Elements | UTS 35's Week Elements }
 *
 * @public
 */
export interface LocaleWeekInfo {
  /**
   * An integer indicating the first day of the week for the locale.
   * Can be either 1 (Monday), 6 (Saturday) or 7 (Sunday).
   */
  firstDay: 1 | 6 | 7

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
