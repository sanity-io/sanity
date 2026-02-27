/**
 * Converts a Moment.js format string into a UTS 35 (Unicode Technical Standard #35)
 * format string
 *
 * This function doesn't take absolutely every token into account, but should cover
 * all common cases. If you find a missing token, feel free to add it.
 *
 */
export function momentToDateFnsFormat(momentFormat: string): string {
  // A list of replacements from Moment tokens to date-fns tokens
  // ordered from longest to shortest to prevent partial replacements
  const formatMap: Record<string, string> = {
    YYYY: 'yyyy',
    YY: 'yy',
    MMMM: 'MMMM',
    MMM: 'MMM',
    MM: 'MM',
    M: 'M',
    DD: 'dd',
    D: 'd',
    dddd: 'EEEE',
    ddd: 'EEE',
    HH: 'HH',
    H: 'H',
    hh: 'hh',
    h: 'h',
    mm: 'mm',
    m: 'm',
    ss: 'ss',
    s: 's',
    A: 'a',
    a: 'a',
  }

  // Replace each token in the format string
  return Object.keys(formatMap).reduce(
    (acc, key) => acc.replace(new RegExp(key, 'g'), formatMap[key]),
    momentFormat,
  )
}
