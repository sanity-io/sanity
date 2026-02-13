/**
 * Utilities for handling release title display and truncation
 * @internal
 */

const DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT = 50

/**
 * Resolves a release title, returning the fallback if the title is empty/undefined
 * @param title - The release title (may be undefined or empty)
 * @param fallback - The fallback string to use when title is absent
 * @returns The resolved title string
 */
export function getReleaseTitle(title: string | undefined, fallback: string): string {
  return title || fallback
}

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
  const fullTitle = getReleaseTitle(title, fallback)
  const isTruncated = fullTitle.length > DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT
  const displayTitle = isTruncated
    ? `${fullTitle.slice(0, DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT)}...`
    : fullTitle

  return {displayTitle, fullTitle, isTruncated}
}
