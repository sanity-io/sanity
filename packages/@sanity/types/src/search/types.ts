/**
 * @public
 */
export const searchStrategies = ['groqLegacy', 'textSearch', 'groq2024'] as const

/**
 * @public
 */
export type SearchStrategy = (typeof searchStrategies)[number]
