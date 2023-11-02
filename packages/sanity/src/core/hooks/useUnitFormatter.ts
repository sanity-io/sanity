import {intlCache} from '../i18n/intlCache'
import {useCurrentLocale} from '../i18n/hooks/useLocale'

/**
 * Options for the `useUnitFormatter` hook
 *
 * @public
 */
export type UseUnitFormatterOptions = Omit<Intl.NumberFormatOptions, 'unit'>

/**
 * Available measurement units
 *
 * @public
 */
export type FormattableMeasurementUnit =
  | 'acre'
  | 'bit'
  | 'byte'
  | 'celsius'
  | 'centimeter'
  | 'day'
  | 'degree'
  | 'fahrenheit'
  | 'fluid-ounce'
  | 'foot'
  | 'gallon'
  | 'gigabit'
  | 'gigabyte'
  | 'gram'
  | 'hectare'
  | 'hour'
  | 'inch'
  | 'kilobit'
  | 'kilobyte'
  | 'kilogram'
  | 'kilometer'
  | 'liter'
  | 'megabit'
  | 'megabyte'
  | 'meter'
  | 'mile'
  | 'mile-scandinavian'
  | 'milliliter'
  | 'millimeter'
  | 'millisecond'
  | 'minute'
  | 'month'
  | 'ounce'
  | 'percent'
  | 'petabyte'
  | 'pound'
  | 'second'
  | 'stone'
  | 'terabit'
  | 'terabyte'
  | 'week'
  | 'yard'
  | 'year'

/**
 * Returns a formatter with the given options. Function takes a number and the unit to format as
 * the second argument. The formatter will yield localized output, based on the users' selected
 * locale.
 *
 * This differs from regular `Intl.NumberFormat` in two ways:
 * 1. You do not need to instantiate a new formatter for each unit you want to format
 *    (still happens behind the scenes, but is memoized)
 * 2. The default unit display style (`unitDisplay`) is `long`
 *
 * @example
 * ```ts
 * function MyComponent() {
 *   const format = useUnitFormatter()
 *   return <div>{format(2313, 'meter')}</div>
 *   // en-US -> 2,313 meters
 *   // fr-FR -> 2 313 mètres
 * }
 * ```
 *
 * @param options - Optional options for the unit formatter
 * @returns Formatter function
 * @public
 */
export function useUnitFormatter(
  options: UseUnitFormatterOptions = {},
): (value: number, unit: FormattableMeasurementUnit) => string {
  const currentLocale = useCurrentLocale()
  const defaultOptions: Intl.NumberFormatOptions = {
    unitDisplay: 'long',
    ...options,
    style: 'unit',
  }

  return function format(value: number, unit: FormattableMeasurementUnit) {
    const formatter = intlCache.numberFormat(currentLocale, {...defaultOptions, unit})
    return formatter.format(value)
  }
}
