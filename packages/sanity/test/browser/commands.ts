import {appendFileSync, readFileSync} from 'node:fs'
import path from 'node:path'

import {type BrowserCommand} from 'vitest/node'

/**
 * Read a file from the filesystem as base64 (server-side command).
 * Used by browser tests that need to read test fixture files (e.g., images).
 */
export const readFileAsBase64: BrowserCommand<[filePath: string]> = ({testPath}, filePath) => {
  if (!testPath) {
    throw new Error('readFileAsBase64 can only be used within a test file')
  }
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(path.dirname(testPath), filePath)
  const buffer = readFileSync(resolved)
  return buffer.toString('base64')
}

/** Append one NDJSON debug line for Chromatic flake investigation (temporary). */
export const appendDebugLog: BrowserCommand<[payload: string]> = (_ctx, payload) => {
  appendFileSync('/opt/cursor/logs/debug.log', `${payload}\n`)
}
