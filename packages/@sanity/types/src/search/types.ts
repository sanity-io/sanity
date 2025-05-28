/**
 * @public
 */
export const searchStrategies = ['groqLegacy', 'groq2024'] as const

/**
 * @public
 */
export type SearchStrategy = (typeof searchStrategies)[number]
