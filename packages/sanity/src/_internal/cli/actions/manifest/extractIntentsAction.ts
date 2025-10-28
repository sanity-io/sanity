import {access} from 'node:fs/promises'
import path from 'node:path'

import {type ManifestIntent} from '../../../manifest/manifestTypes'

/**
 * Get all intent files from a directory recursively
 * Looks for .ts, .js, and .mjs files
 */
async function getIntentFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  try {
    const fs = await import('node:fs/promises')
    const entries = await fs.readdir(dir, {withFileTypes: true})

    // Process directory entries sequentially for recursion
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await getIntentFiles(fullPath)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        // Check if it's a JavaScript/TypeScript file
        const ext = path.extname(entry.name).toLowerCase()
        if (['.ts', '.js', '.mjs'].includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return []
  }

  return files
}

/**
 * Load an intent file and return the intent definition
 */
async function loadIntentFile(filePath: string): Promise<ManifestIntent> {
  // Register esbuild for TypeScript support
  const {unregister} = __DEV__
    ? {unregister: () => undefined}
    : require('esbuild-register/dist/node').register({supported: {'dynamic-import': true}})

  try {
    // Convert to absolute path
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath)

    // Use require to load the file (same pattern as getStudioConfig)
    // eslint-disable-next-line import/no-dynamic-require
    const module = require(absolutePath)

    // Handle both CommonJS and ESM exports
    const intentDefinition =
      module && typeof module === 'object' && 'default' in module ? module.default : module

    if (!intentDefinition) {
      throw new Error('No default export found')
    }

    // Extract just the fields we need for the manifest
    const {id, action, title, description, filters} = intentDefinition

    if (!id || !action || !title) {
      throw new Error('Intent must have id, action, and title')
    }

    return {
      id,
      action,
      title,
      description: description || '',
      filters: filters || [],
    }
  } catch (error) {
    throw new Error(`Failed to load intent file: ${error.message}`, {cause: error})
  } finally {
    unregister()
  }
}

/**
 * Extract intents from the intents directory
 * Returns an array of intent definitions
 */
export async function extractIntents(options: {
  workDir: string
  intentsDir?: string
}): Promise<ManifestIntent[]> {
  const {workDir, intentsDir = '_intents'} = options
  const targetDir = path.resolve(workDir, intentsDir)

  // Check if directory exists
  try {
    await access(targetDir)
  } catch {
    // Directory doesn't exist, return empty array
    return []
  }

  // Get all intent files
  const intentFiles = await getIntentFiles(targetDir)

  if (intentFiles.length === 0) {
    return []
  }

  // Load each intent file
  const intents: ManifestIntent[] = []

  // Process files sequentially to avoid overwhelming the system
  for (const filePath of intentFiles) {
    try {
      const intent = await loadIntentFile(filePath)
      intents.push(intent)
    } catch (error) {
      // Log error but continue with other files
      console.warn(`Warning: Failed to load intent file ${filePath}: ${error.message}`)
    }
  }

  return intents
}
