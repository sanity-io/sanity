import {type Context, createContext} from 'react'

import {SANITY_VERSION} from '../core/version'

const MISSING_CONTEXT_HELP_URL = 'https://www.sanity.io/help/missing-context-error'

/**
 * Whether this copy of `sanity` should keep its React contexts module-local
 * instead of registering them in the `globalThis` singleton registry below.
 *
 * The global registry exists to rescue a single application that accidentally
 * bundles two copies of the same `sanity` version (provider from one copy,
 * consumer from the other still match). An intentionally *embedded* copy —
 * e.g. an application built on `sanity/_unstable-embedded` that is mounted as
 * a federated island inside a host studio's window, with its own React root —
 * never shares a React tree with the host, so global sharing buys it nothing
 * and the exact-version guard would crash module evaluation whenever the host
 * studio runs any other `sanity` version. Such embedders opt out at build
 * time by defining `process.env.SANITY_ISOLATED_CONTEXTS` as `'true'`.
 */
let isolatedContexts = false
try {
  isolatedContexts = process.env.SANITY_ISOLATED_CONTEXTS === 'true'
} catch {
  // ignore, assume process.env is not defined by the runtime
}

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
   * Embedded copies keep contexts local: they own their whole React tree, so
   * cross-copy context sharing is unnecessary and the version guard below
   * must not be able to fail a host studio with a different `sanity` version.
   */
  if (isolatedContexts) {
    return createContext<ContextType>(defaultValue)
  }

  /**
   * Prevent errors about re-renders on React SSR on Next.js App Router, as well as JSDOM-based
   * environments such as when we extract schemas etc from the studio configuration.
   */
  if (
    typeof document === 'undefined' ||
    (typeof window !== 'undefined' &&
      typeof window.navigator !== 'undefined' &&
      window.navigator.userAgent.includes('jsdom'))
  ) {
    return createContext<ContextType>(defaultValue)
  }

  if (!globalScope[symbol]) {
    globalScope[symbol] = {context: createContext<T>(defaultValue), version: SANITY_VERSION}
  } else if (globalScope[symbol].version !== SANITY_VERSION) {
    throw new TypeError(
      `Duplicate instances of context "${key}" with incompatible versions detected: Expected ${SANITY_VERSION} but got ${globalScope[symbol].version}.\n\n` +
        `For more information, please visit ${MISSING_CONTEXT_HELP_URL}`,
    )
  } else if (!warned.has(SANITY_VERSION)) {
    console.warn(
      `Duplicate instances of context "${key}" detected. This is likely a mistake and may cause unexpected behavior.\n\n` +
        `For more information, please visit ${MISSING_CONTEXT_HELP_URL}`,
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
