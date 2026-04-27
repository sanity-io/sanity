import {readFileSync} from 'node:fs'
import path from 'node:path'

import type {BrowserCommand} from 'vitest/node'

/**
 * Read a file from the filesystem as base64 (server-side command).
 * Used by browser tests that need to read test fixture files (e.g., images).
 */
export const readFileAsBase64: BrowserCommand<[filePath: string]> = ({testPath}, filePath) => {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(path.dirname(testPath), filePath)
  const buffer = readFileSync(resolved)
  return buffer.toString('base64')
}
