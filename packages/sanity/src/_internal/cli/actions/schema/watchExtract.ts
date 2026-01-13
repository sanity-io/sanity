import path from 'node:path'

import {type CliOutputter} from '@sanity/cli'
import chokidar, {type FSWatcher} from 'chokidar'
import {debounce} from 'lodash-es'

/** Default glob patterns to watch for schema changes */
export const DEFAULT_WATCH_PATTERNS = [
  'sanity.config.{js,jsx,ts,tsx,mjs}',
  'schema*/**/*.{js,jsx,ts,tsx,mjs}',
]

/** Default patterns to ignore when watching */
const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/lib/**',
  '**/.sanity/**',
]

interface WatchExtractOptions {
  workDir: string
  patterns: string[]
  debounceMs?: number
  onExtract: () => Promise<void>
  output: CliOutputter
}

/** State for tracking extraction status */
export interface WatchState {
  isExtracting: boolean
  pendingExtraction: boolean
}

/** Return type for createExtractionRunner */
export interface ExtractionRunner {
  state: WatchState
  runExtraction: () => Promise<void>
}

/**
 * Creates an extraction runner with concurrency control.
 * If extraction is already running, queues one more extraction to run after completion.
 * Multiple queued requests are coalesced into a single pending extraction.
 */
export function createExtractionRunner(onExtract: () => Promise<void>): ExtractionRunner {
  const state: WatchState = {
    isExtracting: false,
    pendingExtraction: false,
  }

  async function runExtraction(): Promise<void> {
    if (state.isExtracting) {
      state.pendingExtraction = true
      return
    }

    state.isExtracting = true
    state.pendingExtraction = false

    try {
      await onExtract()
    } finally {
      state.isExtracting = false

      // If a change came in during extraction, run again
      if (state.pendingExtraction) {
        state.pendingExtraction = false
        await runExtraction()
      }
    }
  }

  return {state, runExtraction}
}

/**
 * Creates a file watcher that triggers schema extraction on changes.
 * Implements debouncing and concurrency control to prevent multiple extractions.
 */
export async function createSchemaWatcher(options: WatchExtractOptions): Promise<FSWatcher> {
  const {workDir, patterns, debounceMs = 1000, onExtract, output} = options

  const {runExtraction} = createExtractionRunner(onExtract)

  // Debounced extraction trigger
  const debouncedExtract = debounce(() => {
    void runExtraction()
  }, debounceMs)

  // Build absolute patterns for watching
  const absolutePatterns = patterns.map((pattern) =>
    path.isAbsolute(pattern) ? pattern : path.join(workDir, pattern),
  )

  const watcher = chokidar.watch(absolutePatterns, {
    ignoreInitial: true,
    ignored: IGNORED_PATTERNS,
    cwd: workDir,
  })

  watcher.on('all', (event, filePath) => {
    const timestamp = new Date().toLocaleTimeString()
    const relativePath = path.isAbsolute(filePath) ? path.relative(workDir, filePath) : filePath
    output.print(`[${timestamp}] ${event}: ${relativePath}`)
    debouncedExtract()
  })

  watcher.on('error', (err) => {
    output.error(`Watcher error: ${err instanceof Error ? err.message : String(err)}`)
  })

  return watcher
}
