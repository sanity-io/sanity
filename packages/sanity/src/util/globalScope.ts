import type {GlobalErrorChannel} from '../components/globalErrorHandler'

/**
 * Gets the global scope instance in a given environment.
 *
 * The strategy is to return the most modern, and if not, the most common:
 * - The `globalThis` variable is the modern approach to accessing the global scope
 * - The `window` variable is the global scope in a web browser
 * - The `self` variable is the global scope in workers and others
 * - The `global` variable is the global scope in Node.js
 */
function getGlobalScope(): typeof globalThis & {__sanityErrorChannel?: GlobalErrorChannel} {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof window !== 'undefined') return window
  if (typeof self !== 'undefined') return self
  if (typeof global !== 'undefined') return global

  throw new Error('@sanity/ui: could not locate global scope')
}

export const globalScope = getGlobalScope()
