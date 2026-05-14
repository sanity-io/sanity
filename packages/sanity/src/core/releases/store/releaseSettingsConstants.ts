/**
 * Document type for the project-level release-settings singleton. The `system.` prefix
 * is naming convention (mirrors `system.release`); it has no permission semantics.
 * Only the `_id` namespace affects write permissions.
 * @internal
 */
export const RELEASE_SETTINGS_DOCUMENT_TYPE: 'system.releaseSettings' = 'system.releaseSettings'

/**
 * Well-known ID for the project-level release-settings singleton. One per dataset.
 * Stored at a regular ID (no `_.` prefix) so editors can write it without the elevated
 * `manage` role that the `_.<prefix>.*` namespace requires.
 * @internal
 */
export const RELEASE_SETTINGS_DOCUMENT_ID = 'releaseSettings.singleton'
