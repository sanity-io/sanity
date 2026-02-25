/**
 * Utilities for handling release title display and truncation
 * @internal
 */

import {truncateString} from '../../util/unicodeString'

const DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT = 50

/**
 * Returns structured title details for consumers that need both
 * the truncated display title and tooltip data.
 * @param title - The release title (may be undefined or empty)
 * @param fallback - The fallback string to use when title is absent
 * @returns Object with displayTitle, fullTitle, and isTruncated flag
 */
export function getReleaseTitleDetails(
  title: string | undefined,
  fallback: string,
): {displayTitle: string; fullTitle: string; isTruncated: boolean} {
  const fullTitle = title || fallback
  const isTruncated = fullTitle.length > DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT
  const displayTitle = isTruncated
    ? truncateString(fullTitle, DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT)
    : fullTitle

  return {displayTitle, fullTitle, isTruncated}
}
