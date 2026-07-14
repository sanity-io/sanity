import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

/** Absolute path to perf/bench regardless of the invocation cwd. */
export const BENCH_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/**
 * Resolve a user-supplied path against the directory the user invoked pnpm
 * from (INIT_CWD) — the `pnpm bench` script chain runs with cwd perf/bench,
 * which is invisible to the caller, so plain `path.resolve` would silently
 * nest relative paths under perf/bench.
 */
export function resolveFromInvocation(input: string): string {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), input)
}
