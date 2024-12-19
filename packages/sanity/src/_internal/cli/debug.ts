import {lstatSync} from 'node:fs'
import {join} from 'node:path'

import debugIt from 'debug'

export const debug = debugIt('sanity:core')

function isDir(path: string): boolean {
  try {
    return lstatSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * Runs a function such that it will be profiled when the environment variable
 * SANITY_DEBUG_PROFILING is set to a directory. A file (starting with `key`) will
 * be placed in said directory. The generated file can be inspected by using the
 * Speedscpe NPM package: `speedscope ${filename}` opens a UI in the browser.
 */
export async function withTracingProfiling<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const dir = process.env.SANITY_DEBUG_PROFILING
  if (!dir) return await fn()

  if (!isDir(dir))
    throw new Error(`SANITY_DEBUG_PROFILING (${JSON.stringify(dir)}) must be set to a directory`)

  let profiling
  try {
    profiling = await import('./util/profiling')
  } catch (err) {
    throw new Error(`Failed to load SANITY_DEBUG_PROFILING: ${err}`)
  }

  const filenamePrefix = join(dir, key)
  return profiling.withTracing(filenamePrefix, fn)
}
