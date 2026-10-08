import {readFileSync} from 'node:fs'
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

/**
 * Leave every request to `url` pending until `releaseRequests` (server-side command), for browser
 * tests that need a resource that never finishes loading.
 */
export const holdRequests: BrowserCommand<[url: string]> = async ({page}, url) => {
  await page.route(url, () => undefined)
}

/** Stop holding the requests to `url` that `holdRequests` held (server-side command). */
export const releaseRequests: BrowserCommand<[url: string]> = async ({page}, url) => {
  await page.unroute(url)
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    holdRequests: (url: string) => Promise<void>
    releaseRequests: (url: string) => Promise<void>
  }
}
