/**
 * @public
 */
export const searchStrategies = ['groq2024', 'groqLegacy'] as const

/**
 * @public
 */
export type SearchStrategy = (typeof searchStrategies)[number]
