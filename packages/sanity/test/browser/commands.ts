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

interface Hold {
  released: boolean
  routes: {abort: () => Promise<void>}[]
}

// Per page: every browser instance of a run shares this module
const holdsByPage = new WeakMap<object, Map<string, Hold>>()

/**
 * Leave every request to `url` pending until `releaseRequests` (server-side command), for browser
 * tests that need a resource that never finishes loading.
 */
export const holdRequests: BrowserCommand<[url: string]> = async ({page}, url) => {
  const holds = holdsByPage.get(page) ?? new Map<string, Hold>()
  holdsByPage.set(page, holds)
  const hold: Hold = {released: false, routes: []}
  holds.set(url, hold)
  await page.route(url, async (route) => {
    // A request intercepted while `releaseRequests` runs must not be left pending either
    if (hold.released) {
      await route.abort()
    } else {
      hold.routes.push(route)
    }
  })
}

/** Abort the requests to `url` that `holdRequests` held, and stop holding new ones. */
export const releaseRequests: BrowserCommand<[url: string]> = async ({page}, url) => {
  const hold = holdsByPage.get(page)?.get(url)
  holdsByPage.get(page)?.delete(url)
  if (hold) {
    hold.released = true
    await Promise.all(hold.routes.map((route) => route.abort()))
  }
  // Abort before unrouting: unrouting settles the held requests itself, after which abort() throws
  await page.unroute(url)
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    holdRequests: (url: string) => Promise<void>
    releaseRequests: (url: string) => Promise<void>
  }
}
