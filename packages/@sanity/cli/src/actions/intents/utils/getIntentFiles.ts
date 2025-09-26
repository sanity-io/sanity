import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Get all intent files from a directory
 * Looks for .ts, .js, and .mjs files
 */
export async function getIntentFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(dir, {withFileTypes: true})

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

  return files
}
