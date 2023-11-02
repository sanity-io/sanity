import {intlCache} from '../intlCache'
import {useCurrentLocale} from './useLocale'

/**
 * Options for the `useIntlDateTimeFormat` hook
 *
 * @public
 */
export type UseIntlDateTimeFormatOptions = Omit<
  Intl.DateTimeFormatOptions,
  'fractionalSecondDigits'
>

/**
 * Returns an instance of `Intl.DateTimeFormat` that uses the currently selected locale,
 * and enables locale and culture-sensitive date formatting.
 *
 * @param options - Optional options for the date/time formatter
 * @returns Instance of `Intl.DateTimeFormat`
 * @public
 */
export function useIntlDateTimeFormat(
  options: UseIntlDateTimeFormatOptions = {},
): Intl.DateTimeFormat {
  const currentLocale = useCurrentLocale()
  return intlCache.dateTimeFormat(currentLocale, options)
}
