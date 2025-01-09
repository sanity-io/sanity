/**
 * @internal
 */
export const diffViewModes = ['version'] as const

/**
 * @internal
 */
export type DiffViewMode = (typeof diffViewModes)[number]
