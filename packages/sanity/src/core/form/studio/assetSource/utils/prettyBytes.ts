const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const BIBYTE_UNITS = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
const BIT_UNITS = ['b', 'kbit', 'Mbit', 'Gbit', 'Tbit', 'Pbit', 'Ebit', 'Zbit', 'Ybit']
const BIBIT_UNITS = ['b', 'kibit', 'Mibit', 'Gibit', 'Tibit', 'Pibit', 'Eibit', 'Zibit', 'Yibit']

/**
 * Formats the given number using `Number#toLocaleString`.
 * - If locale is a string, the value is expected to be a locale-key (for example: `de`).
 * - If locale is true, the system default locale is used for translation.
 * - If no value for locale is specified, the number is returned unmodified.
 */
const toLocaleString = (
  number: string | number,
  locale: string | string[] | undefined | boolean,
  options: Intl.NumberFormatOptions | undefined,
) => {
  let result = number
  if (typeof locale === 'string' || Array.isArray(locale)) {
    result = number.toLocaleString(locale, options)
  } else if (locale === true || options !== undefined) {
    result = number.toLocaleString(undefined, options)
  }

  return result
}

interface PrettyBytesOptions {
  /**
   * Include plus sign for positive numbers. If the difference is exactly zero a
   * space character will be prepended instead for better alignment.
   */
  signed?: boolean
  /**
   * Format the number as bits instead of bytes. This can be useful when, for
   * example, referring to bit rate.
   */
  bits?: boolean
  /**
   * Format the number using the Binary Prefix instead of the SI Prefix. This
   * can be useful for presenting memory amounts. However, this should not be used for presenting file sizes.
   */
  binary?: boolean
  /**
   * Important: Only the number and decimal separator are localized. The unit
   * title is not and will not be localized.
   */
  locale?: boolean | string | string[]
  /**
   * The minimum number of fraction digits to display.
   *
   * If neither minimumFractionDigits or maximumFractionDigits are set, the
   * default behavior is to round to 3 significant digits.
   */
  minimumFractionDigits?: number
  /**
   * The maximum number of fraction digits to display.
   *
   * If neither minimumFractionDigits or maximumFractionDigits are set, the
   * default behavior is to round to 3 significant digits.
   */
  maximumFractionDigits?: number
}

/**
 * Taken from here:
 * https://github.com/sindresorhus/pretty-bytes/blob/a0335ab397a1bc88831f317e4d6d46b7e03ea6be/index.js
 */
export function prettyBytes(
  input: number,
  {
    bits = false,
    binary = false,
    signed = false,
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
  }: PrettyBytesOptions = {},
): string {
  let number: string | number = input

  if (!Number.isFinite(number)) {
    throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`)
  }

  // eslint-disable-next-line no-nested-ternary
  const UNITS = bits ? (binary ? BIBIT_UNITS : BIT_UNITS) : binary ? BIBYTE_UNITS : BYTE_UNITS

  if (signed && number === 0) {
    return ` 0 ${UNITS[0]}`
  }

  const isNegative = number < 0
  // eslint-disable-next-line no-nested-ternary
  const prefix = isNegative ? '-' : signed ? '+' : ''

  if (isNegative) {
    number = -number
  }

  let localeOptions: Intl.NumberFormatOptions | undefined

  if (minimumFractionDigits !== undefined) {
    localeOptions = {minimumFractionDigits}
  }

  if (maximumFractionDigits !== undefined) {
    localeOptions = {maximumFractionDigits, ...localeOptions}
  }

  if (number < 1) {
    const numberString = toLocaleString(number, locale, localeOptions)
    return `${prefix + numberString} ${UNITS[0]}`
  }

  const exponent = Math.min(
    Math.floor(binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3),
    UNITS.length - 1,
  )
  number /= (binary ? 1024 : 1000) ** exponent

  if (!localeOptions) {
    number = number.toPrecision(3)
  }

  const numberString = toLocaleString(Number(number), locale, localeOptions)

  const unit = UNITS[exponent]

  return `${prefix + numberString} ${unit}`
}
