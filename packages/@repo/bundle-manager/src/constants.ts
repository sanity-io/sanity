export const corePkgs = ['sanity', '@sanity/vision'] as const
export const appVersion = 'v1'

export const VALID_TAGS = ['latest', 'stable', 'next'] as const

/**
 * How long to keep previous tags around (in seconds) to account for potential delays in manifest propagation.
 * This buffer ensures that the module-server does not serve tags newer than
 * the buffer time, allowing all pods to synchronize with the latest available manifest.
 */
export const STALE_TAGS_EXPIRY_SECONDS = 5 * 60
