import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'esbuild'

const INSTRUMENTATION_DIR = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'instrumentation',
)

async function bundleEntry(entry: string): Promise<string> {
  const result = await build({
    entryPoints: [path.join(INSTRUMENTATION_DIR, entry)],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
  })
  const output = result.outputFiles[0]
  if (!output) {
    throw new Error(`esbuild produced no output for the ${entry} instrumentation bundle`)
  }
  return output.text
}

/**
 * Bundle the in-page collector to an IIFE at runner startup (precedent:
 * perf/tests/runner/utils/bundlePerfHelpers). No separate build step means
 * the injected code can never go stale relative to its source.
 */
export async function bundleInstrumentation(): Promise<string> {
  return bundleEntry('index.ts')
}

/**
 * The settle-only in-page script (React commit counter) — injected by the
 * settle session exclusively, so the shared collector above stays untouched
 * for every other mode.
 */
export async function bundleSettleInstrumentation(): Promise<string> {
  return bundleEntry('settle.ts')
}
