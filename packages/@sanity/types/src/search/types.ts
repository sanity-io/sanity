/**
 * @public
 */
export const searchStrategies = ['groqLegacy', 'textSearch'] as const

/**
 * @public
 */
export type SearchStrategy = (typeof searchStrategies)[number]
