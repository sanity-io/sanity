import path from 'node:path'

import {dynamicRequire} from '../../../util/dynamicRequire'
import {type IntentDefinition} from '../types'
import {defineIntentBackup} from './defineIntent'

// Cache for the defineIntent function to avoid repeated imports
let defineIntentFn: ((intent: any) => any) | null = null

/**
 * Get the defineIntent function, preferring SDK version but falling back to our backup
 */
async function getDefineIntent(): Promise<(intent: any) => any> {
  if (defineIntentFn === null) {
    try {
      // Try to import defineIntent from the SDK package first
      // (note: this is currently kind of a nightmare because ES modules, never got this to work)
      // @ts-expect-error - This may not exist yet, but that's OK
      const module = await import('@sanity/sdk')
      defineIntentFn = module.defineIntent
    } catch (error) {
      // If the SDK version isn't available, use our backup implementation
      defineIntentFn = defineIntentBackup
    }
  }
  return defineIntentFn!
}

/**
 * Load an intent file and return the intent definition
 *
 * This function handles both cases:
 * 1. Raw intent objects: export default \{ id: 'foo', action: 'view', ... \}
 * 2. Helper-wrapped objects: export default defineIntent(\{ ... \})
 *
 * Simple approach using the same pattern as sanity.cli.ts loading.
 */
export async function loadIntentFile(filePath: string): Promise<IntentDefinition> {
  // Register esbuild for TypeScript support, same as getCliConfig
  const {unregister} = __DEV__
    ? {unregister: () => undefined}
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('esbuild-register/dist/node').register({supported: {'dynamic-import': true}})

  try {
    // Convert to absolute path
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath)

    // Use dynamicRequire to load the file (same as sanity.cli.ts)
    const module = dynamicRequire(absolutePath)

    // Handle both CommonJS and ESM exports
    const intentDefinition =
      module && typeof module === 'object' && 'default' in module ? module.default : module

    if (!intentDefinition) {
      throw new Error('No default export found')
    }

    // Normalize/validate the intent using defineIntent (SDK version or backup)
    const defineIntent = await getDefineIntent()
    try {
      // Apply defineIntent for validation and normalization
      // This works whether the user already called defineIntent() or not
      return defineIntent(intentDefinition) as IntentDefinition
    } catch (validationError) {
      throw new Error(`Intent validation failed: ${validationError.message}`)
    }
  } catch (error) {
    throw new Error(`Failed to load intent file: ${error.message}`)
  } finally {
    unregister()
  }
}
