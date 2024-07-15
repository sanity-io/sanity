import {type Context, createContext} from 'react'

import {SANITY_VERSION} from '../core/version'

/**
 * @internal
 * @hidden
 */
export function createGlobalScopedContext<ContextType, const T extends ContextType = ContextType>(
  /**
   * It's important to prefix these keys as they are global
   */
  key: `sanity/_singletons/context/${string}`,
  defaultValue: T,
): Context<ContextType> {
  const symbol = Symbol.for(key)

  /**
   * Prevent errors about re-renders on React SSR on Next.js App Router
   */
  if (typeof document === 'undefined') {
    return createContext<ContextType>(defaultValue)
  }

  if (!globalScope[symbol]) {
    globalScope[symbol] = {context: createContext<T>(defaultValue), version: SANITY_VERSION}
  } else if (globalScope[symbol].version !== SANITY_VERSION) {
    throw new TypeError(
      `Duplicate instances of sanity context with incompatible versions detected: expected ${SANITY_VERSION}, got ${globalScope[symbol].version} on key "${key}"`,
    )
  } else if (!warned.has(SANITY_VERSION)) {
    console.warn(
      `Duplicate instances of sanity context on key "${key}" detected. This is likely a mistake and could lead to problems.`,
    )
    warned.add(SANITY_VERSION)
  }

  return globalScope[symbol].context
}

const warned = new Set<typeof SANITY_VERSION>()

/**
 * Gets the global scope instance in a given environment.
 *
 * The strategy is to return the most modern, and if not, the most common:
 * - The `globalThis` variable is the modern approach to accessing the global scope
 * - The `window` variable is the global scope in a web browser
 * - The `self` variable is the global scope in workers and others
 * - The `global` variable is the global scope in Node.js
 */
function getGlobalScope() {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof window !== 'undefined') return window
  if (typeof self !== 'undefined') return self
  if (typeof global !== 'undefined') return global

  throw new Error('sanity: could not locate global scope')
}

const globalScope = getGlobalScope() as any
