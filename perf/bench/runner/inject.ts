import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'esbuild'

const INSTRUMENTATION_ENTRY = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'instrumentation',
  'index.ts',
)

/**
 * Bundle the in-page collector to an IIFE at runner startup (precedent:
 * perf/tests/runner/utils/bundlePerfHelpers). No separate build step means
 * the injected code can never go stale relative to its source.
 */
export async function bundleInstrumentation(): Promise<string> {
  const result = await build({
    entryPoints: [INSTRUMENTATION_ENTRY],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
  })
  const output = result.outputFiles[0]
  if (!output) {
    throw new Error('esbuild produced no output for the instrumentation bundle')
  }
  return output.text
}
