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

/**
 * Sets up a Module._load wrapper to silently ignore imports from https://themer.sanity.build
 * This allows users to use themer URL imports in their config without breaking CLI commands.
 *
 * @returns Handler result with cleanup function
 * @internal
 */
export function setupImportErrorHandler(): ImportErrorHandlerResult {
  // Store original Module._load
  const ModuleConstructor = Module as unknown as ModuleConstructor
  const originalLoad = ModuleConstructor._load

  // Override Module._load to catch and handle themer.sanity.build imports
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
