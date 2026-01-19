import path from 'node:path'

import chokidar, {type FSWatcher} from 'chokidar'
import {debounce} from 'lodash-es'

import {type CliOutputter} from '../../types'

/** Default patterns to ignore when watching */
const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/lib/**',
  '**/.sanity/**',
]

interface WatchTypegenOptions {
  workDir: string
  /** Patterns for query files to watch */
  queryPatterns: string[]
  /** Path to the schema JSON file to watch */
  schemaPath: string
  debounceMs?: number
  onGenerate: () => Promise<void>
  output: CliOutputter
}

/** State for tracking generation status */
export interface WatchState {
  isGenerating: boolean
  pendingGeneration: boolean
}

/** Return type for createTypegenRunner */
export interface TypegenRunner {
  state: WatchState
  runGeneration: () => Promise<void>
}

/**
 * Creates a typegen runner with concurrency control.
 * If generation is already running, queues one more generation to run after completion.
 * Multiple queued requests are coalesced into a single pending generation.
 */
export function createTypegenRunner(onGenerate: () => Promise<void>): TypegenRunner {
  const state: WatchState = {
    isGenerating: false,
    pendingGeneration: false,
  }

  async function runGeneration(): Promise<void> {
    if (state.isGenerating) {
      state.pendingGeneration = true
      return
    }

    state.isGenerating = true
    state.pendingGeneration = false

    try {
      await onGenerate()
    } finally {
      state.isGenerating = false

      // If a change came in during generation, run again
      if (state.pendingGeneration) {
        state.pendingGeneration = false
        await runGeneration()
      }
    }
  }

  return {state, runGeneration}
}

/**
 * Creates a file watcher that triggers typegen on changes.
 * Watches both query files (via patterns) and the schema JSON file.
 * Implements debouncing and concurrency control to prevent multiple generations.
 */
export async function createTypegenWatcher(options: WatchTypegenOptions): Promise<FSWatcher> {
  const {workDir, queryPatterns, schemaPath, debounceMs = 1000, onGenerate, output} = options

  const {runGeneration} = createTypegenRunner(onGenerate)

  // Debounced generation trigger
  const debouncedGenerate = debounce(() => {
    void runGeneration()
  }, debounceMs)

  // Build absolute patterns for query files
  const absoluteQueryPatterns = queryPatterns.map((pattern) =>
    path.isAbsolute(pattern) ? pattern : path.join(workDir, pattern),
  )

  // Build absolute path for schema file
  const absoluteSchemaPath = path.isAbsolute(schemaPath)
    ? schemaPath
    : path.join(workDir, schemaPath)

  // Combine query patterns and schema path for watching
  const watchTargets = [...absoluteQueryPatterns, absoluteSchemaPath]

  const watcher = chokidar.watch(watchTargets, {
    ignoreInitial: true,
    ignored: IGNORED_PATTERNS,
    cwd: workDir,
  })

  watcher.on('all', (event: string, filePath: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const relativePath = path.isAbsolute(filePath) ? path.relative(workDir, filePath) : filePath
    output.print(`[${timestamp}] ${event}: ${relativePath}`)
    debouncedGenerate()
  })

  watcher.on('error', (err: Error) => {
    output.error(`Watcher error: ${err.message}`)
  })

  return watcher
}
