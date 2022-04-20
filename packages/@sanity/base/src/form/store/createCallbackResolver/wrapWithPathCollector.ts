import {
  ConditionalPropertyCallback,
  ConditionalPropertyCallbackContext,
  SanityDocument,
  SanityDocumentLike,
} from '@sanity/types'
import {isObject} from 'lodash'

export type TouchedPaths = {[key: string]: TouchedPaths}
type CurrentUser = ConditionalPropertyCallbackContext['currentUser']

// Note: not using `utils/isRecord` because that function returns false for arrays
const isNonPrimitive = isObject as (value: unknown) => value is Record<string, unknown>

function deepGet(
  value: Record<string, unknown>,
  [first, ...rest]: string[]
): Record<string, unknown> | undefined {
  if (!first) return value
  const subvalue = value[first]

  if (!isNonPrimitive(subvalue)) return undefined
  return deepGet(subvalue, rest)
}

interface WrapWithPathCollectorOptions {
  callback: ConditionalPropertyCallback
  path: string[]
}

interface CallbackWithTouchedPaths {
  (options: {document: SanityDocumentLike; currentUser: CurrentUser}): [boolean, TouchedPaths]
}

/**
 * Wraps a conditional callback function with another function that intercepts
 * the context params with a proxy to track the values touched during the
 * execution of the function.
 *
 * The intercepting function also creates the `value` and `parent` keys of the
 * context params by recursively drilling into the proxied document by the given
 * path. This enables the proxy to track when the user reaches into both the
 * `value` and `parent` keys in the same way it tracks touched values in the
 * top-level document.
 *
 * The resulting interface for the returned wrapped function then only requires
 * the `document` and `currentUser` (without needing the `value` and `parent`).
 */
export function wrapWithPathCollector({
  callback,
  path,
}: WrapWithPathCollectorOptions): CallbackWithTouchedPaths {
  function wrapWithTouchedProxy<T extends Record<string, unknown>>(
    obj: T,
    touched: TouchedPaths
  ): T {
    return new Proxy(obj, {
      get: (target, property: string) => {
        const value = target[property]

        // no-op for functions
        if (typeof value === 'function') return value

        touched[property] = touched[property] || {}

        if (isNonPrimitive(value)) {
          return wrapWithTouchedProxy(value, touched[property])
        }

        return value
      },
    }) as T
  }

  const touchedPaths: TouchedPaths = {}

  function wrapped(options: {
    document: SanityDocumentLike
    currentUser: CurrentUser
  }): [boolean, TouchedPaths] {
    // reset the touched paths
    for (const key of Object.keys(touchedPaths)) {
      delete touchedPaths[key]
    }

    const proxied = wrapWithTouchedProxy(options, touchedPaths)
    const parentPath = ['document', ...path.slice(0, path.length - 1)]
    const valuePath = ['document', ...path]

    const context = {
      get currentUser() {
        return proxied.currentUser
      },
      get value() {
        return deepGet(proxied, valuePath)
      },
      get parent() {
        return deepGet(proxied, parentPath)
      },
      get document() {
        return proxied.document as SanityDocument
      },
    }

    return [callback(context), touchedPaths]
  }

  return wrapped
}
