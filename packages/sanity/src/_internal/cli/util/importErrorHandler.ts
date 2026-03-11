import Module from 'node:module'

export interface ImportErrorHandlerResult {
  cleanup: () => void
}

// Module._load is an internal Node.js API not exposed in types
interface ModuleConstructor {
  _load(request: string, parent: Module | undefined, isMain: boolean): any
}

/**
 * Return safe empty module with Proxy for deep property access. This ensures any property
 * access or function call returns a safe value
 */
function getProxyHandler() {
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === '__esModule') return true
      if (prop === 'default') return new Proxy({}, handler)
      return new Proxy({}, handler)
    },
    apply: () => new Proxy({}, handler),
  }
  return new Proxy({}, handler)
}

/** Map of JS-family extensions to their TypeScript equivalents */
const jsToTsExtension: Record<string, string> = {
  '.js': '.ts',
  '.jsx': '.tsx',
  '.mjs': '.mts',
}

/**
 * Check whether a MODULE_NOT_FOUND error is specifically about the requested module
 * (not a transitive dependency that failed to load).
 */
function isDirectModuleNotFound(error: unknown, request: string): boolean {
  if (
    typeof error !== 'object' ||
    error === null ||
    (error as {code?: string}).code !== 'MODULE_NOT_FOUND'
  ) {
    return false
  }
  // Node includes the module specifier in the error message
  const message = (error as Error).message ?? ''
  return message.includes(request)
}

/**
 * Given a relative/absolute request ending in a JS-family extension, try loading
 * the corresponding TypeScript extension instead. Returns `undefined` if the
 * fallback doesn't apply or also fails.
 */
function tryLoadTsEquivalent(
  request: string,
  parent: Module | undefined,
  isMain: boolean,
  loader: ModuleConstructor['_load'],
  context: unknown,
): unknown {
  if (!request.startsWith('.') && !request.startsWith('/')) return undefined

  for (const [jsExt, tsExt] of Object.entries(jsToTsExtension)) {
    if (!request.endsWith(jsExt)) continue
    const tsRequest = request.slice(0, -jsExt.length) + tsExt
    try {
      return loader.call(context, tsRequest, parent, isMain)
    } catch {
      // TS variant also not found
    }
    break
  }
  return undefined
}

/**
 * Sets up a Module._load wrapper to:
 * 1. Silently ignore imports from https://themer.sanity.build
 * 2. Retry ESM-style `.js` imports as `.ts` when the `.js` file doesn't exist
 *
 * The second behaviour fixes the common case where a TypeScript project uses
 * ESM-style imports (`import {schema} from './schemas/index.js'`) but the
 * actual file on disk is `index.ts`. esbuild-register doesn't perform this
 * fallback on its own.
 *
 * @returns Handler result with cleanup function
 * @internal
 */
export function setupImportErrorHandler(): ImportErrorHandlerResult {
  // Store original Module._load
  const ModuleConstructor = Module as unknown as ModuleConstructor
  const originalLoad = ModuleConstructor._load

  // Override Module._load to catch and handle special import cases
  ModuleConstructor._load = function (
    request: string,
    parent: Module | undefined,
    isMain: boolean,
  ) {
    try {
      return originalLoad.call(this, request, parent, isMain)
    } catch (error) {
      // Check if this is a themer.sanity.build URL import
      if (request.startsWith('https://themer.sanity.build/api/')) {
        // Return a safe proxy object that can be used in place of the theme
        return getProxyHandler()
      }

      // For relative/absolute paths with JS extensions, try the TS equivalent
      if (isDirectModuleNotFound(error, request)) {
        const result = tryLoadTsEquivalent(request, parent, isMain, originalLoad, this)
        if (result !== undefined) return result
      }

      // Re-throw all other errors
      throw error
    }
  }

  return {
    cleanup: () => {
      ModuleConstructor._load = originalLoad
    },
  }
}
