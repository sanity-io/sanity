import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'esbuild'

const INSTRUMENTATION_DIR = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'instrumentation',
)

async function bundleEntry(entry: string, options: {globalName?: string} = {}): Promise<string> {
  const result = await build({
    entryPoints: [path.join(INSTRUMENTATION_DIR, entry)],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    ...(options.globalName ? {globalName: options.globalName} : {}),
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

/** The global the style probe bundle assigns its exports to; session/styles.ts reads it back. */
export const STYLE_PROBE_GLOBAL = '__benchStyleProbe'

/**
 * The style census probe (instrumentation/styles.ts), bundled as an IIFE that
 * assigns its exports to `STYLE_PROBE_GLOBAL`. Evaluated on demand by
 * runner/session/styles.ts rather than installed as an init script — it
 * measures a finished page, and the shared collector must not grow a DOM
 * walker every session pays for.
 */
export async function bundleStyleProbe(): Promise<string> {
  return bundleEntry('styles.ts', {globalName: STYLE_PROBE_GLOBAL})
}
