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

type HeldRequests = Map<string, {abort: () => Promise<void>}[]>

// Per page: every browser instance of a run shares this module
const heldRequestsByPage = new WeakMap<object, HeldRequests>()

/**
 * Leave every request to `url` pending until `releaseRequests` (server-side command), for browser
 * tests that need a resource that never finishes loading.
 */
export const holdRequests: BrowserCommand<[url: string]> = async ({page}, url) => {
  const held: HeldRequests = heldRequestsByPage.get(page) ?? new Map()
  heldRequestsByPage.set(page, held)
  await page.route(url, (route) => {
    held.set(url, [...(held.get(url) ?? []), route])
  })
}

/** Abort the requests to `url` that `holdRequests` held, and stop holding new ones. */
export const releaseRequests: BrowserCommand<[url: string]> = async ({page}, url) => {
  const held = heldRequestsByPage.get(page)
  const routes = held?.get(url) ?? []
  held?.delete(url)
  await Promise.all(routes.map((route) => route.abort()))
  await page.unroute(url)
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    holdRequests: (url: string) => Promise<void>
    releaseRequests: (url: string) => Promise<void>
  }
}
