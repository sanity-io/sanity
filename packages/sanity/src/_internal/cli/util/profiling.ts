import {writeFileSync} from 'node:fs'
import {close as closeInspector, open as openInspector, Session} from 'node:inspector/promises'

// This file should not be imported directly since it depends on
// `inspector/promises` which is only available since Node v19 (and we want to
// support earlier Node versions as well.

/**
 * Runs a function with a tracing profiler and writes the result into a file.
 *
 * @param filenamePrefix - The filename where the report will be written. The full name
 * will be `{filenamePrefix}-{random}.cpuprofile`.
 */
export async function withTracing<T>(filenamePrefix: string, fn: () => Promise<T>): Promise<T> {
  // Make it available in the Chrome DevTools as well

  openInspector()
  const session = new Session()
  session.connect()
  await session.post('Profiler.enable')
  await session.post('Profiler.start')
  try {
    return await fn()
  } finally {
    closeInspector()
    const fullname = `${filenamePrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.cpuprofile`
    const {profile} = await session.post('Profiler.stop')
    writeFileSync(fullname, JSON.stringify(profile))
  }
}
