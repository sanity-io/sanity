const segmenter = typeof Intl === 'object' && 'Segmenter' in Intl ? new Intl.Segmenter() : undefined

/**
 * Truncates a string to a given length, taking into account surrogate pairs and grapheme clusters
 * (using zero-width joiners). This means the resulting string may be longer in number of bytes,
 * but will be shorter in number of "characters". Should only be used for display purposes -
 * not for truncating strings for storage or similar.
 *
 * Examples of differences between `String.prototype.slice` and this function:
 *
 * - '👨‍👨‍👧‍👧'.slice(0, 1) === '�'  vs sliceString('👨‍👨‍👧‍👧', 0, 1) === '👨‍👨‍👧‍👧'
 * - '👨‍👨‍👧‍👧'.slice(0, 2) === '👨' vs sliceString('👨‍👨‍👧‍👧', 0, 2) === '👨‍👨‍👧‍👧'
 *
 * @param str - String to slice
 * @param start - Start index
 * @param end - End index (exclusive)
 * @returns The sliced string
 * @internal
 */
export function sliceString(str: string, start: number, end: number): string {
  if (end < start) {
    throw new Error(
      'End must be greater than start, use `String.prototype.slice()` for negative values',
    )
  }

  if (!segmenter) {
    return str.slice(start, end)
  }

  let i = 0
  let sliced = ''
  for (const value of segmenter.segment(str)) {
    if (i === end) {
      return sliced
    }

    sliced += value.segment
    i++
  }

  return sliced
}

/**
 * Truncates a string to a given length, taking into account surrogate pairs and grapheme clusters
 * (using zero-width joiners). This means the resulting string may be longer in number of bytes,
 * but will be shorter in number of "characters". Should only be used for display purposes -
 * not for truncating strings for storage or similar.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length in "characters"
 * @returns The truncated string
 * @internal
 */
export function truncateString(str: string, maxLength: number): string {
  const truncated = sliceString(str, 0, maxLength)
  return truncated === str ? truncated : `${truncated}…`
}
