/**
 * Utilities for handling release title display and truncation
 * @internal
 */

/** Default character limit for release titles */
export const DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT = 50

/** CSS max-width values for different UI contexts */
export const RELEASE_TITLE_MAX_WIDTHS = {
  /** For compact UI elements like chips and badges */
  compact: '180px',
  /** For medium UI elements like menu items and cards */
  medium: '300px',
  /** For large UI elements like headers and main displays */
  large: '400px',
} as const

/**
 * Truncates a release title to the default character limit
 * @param title - The release title to truncate (returns undefined if title is undefined)
 * @returns Truncated title with "..." if needed, or undefined if input is undefined
 */
export function truncateReleaseTitle(title: string | undefined): string | undefined {
  if (!title) return undefined
  return title.length > DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT
    ? `${title.slice(0, DEFAULT_RELEASE_TITLE_CHARACTER_LIMIT)}...`
    : title
}

/**
 * Gets CSS styles for release title truncation
 * @param maxWidth - Maximum width for the container
 * @returns CSS styles for text truncation
 */
export function getReleaseTitleTruncationStyles(maxWidth?: string) {
  return {
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    ...(maxWidth && {maxWidth}),
  }
}
