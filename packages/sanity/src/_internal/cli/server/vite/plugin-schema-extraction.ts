import path, {isAbsolute} from 'node:path'

import {type CliCommandContext} from '@sanity/cli'
import {debounce, mean, once} from 'lodash-es'
import logSymbols from 'log-symbols'
import picomatch from 'picomatch'
import {type Plugin} from 'vite'

import {
  SchemaExtractedTrace,
  SchemaExtractionWatchModeTrace,
} from '../../actions/schema/extractSchema.telemetry'
import {formatSchemaValidation} from '../../actions/schema/formatSchemaValidation'
import {extractSchemaToFile, SchemaExtractionError} from '../../actions/schema/schemaExtractorApi'

/**
 * Default glob patterns to watch for schema changes.
 * Covers the sanity config file and common schema directory naming conventions.
 */
const DEFAULT_SCHEMA_PATTERNS = [
  'sanity.config.{js,jsx,ts,tsx,mjs}',
  'schema*/**/*.{js,jsx,ts,tsx,mjs}',
]

/** Default debounce delay in milliseconds */
const DEFAULT_DEBOUNCE_MS = 1000

/**
 * Delay before initial extraction to allow Vite to finish startup
 * and avoid race conditions with module resolution.
 */
const INITIAL_EXTRACTION_DELAY_MS = 1000

/**
 * Options for the Sanity schema extraction Vite plugin.
 *
 * @public
 */
export interface SchemaExtractionPluginOptions {
  /**
   * Working directory containing the Sanity configuration.
   * This should be the root of your Sanity Studio project where
   * `sanity.config.ts` is located.
   * @defaultValue Vite's project root (`config.root`)
   */
  workDir?: string

  /**
   * Path where the extracted schema JSON will be written.
   * Can be absolute or relative to the working directory.
   * @defaultValue `path.join(workDir, 'schema.json')`
   */
  outputPath?: string

  /**
   * Logger for output messages. Must implement `log`, `info`, and `error` methods.
   * @defaultValue `console`
   */
  output?: Pick<Console, 'log' | 'info' | 'error'>

  /**
   * Workspace name for multi-workspace Sanity configurations.
   * Required when your `sanity.config.ts` exports multiple workspaces
   * and you want to extract schema from a specific one.
   */
  workspaceName?: string

  /**
   * Additional glob patterns to watch for schema changes.
   * These are merged with the default patterns.
   * @example `['lib/custom-types/**\/*.ts', 'shared/schemas/**\/*.ts']`
   */
  additionalPatterns?: string[]

  /**
   * Debounce delay in milliseconds before triggering extraction
   * after a file change. Helps prevent excessive extractions
   * during rapid file saves.
   * @defaultValue 1000
   */
  debounceMs?: number

  /**
   * When true, marks all fields as required in the extracted schema
   * unless they are explicitly marked as optional.
   * @defaultValue false
   */
  enforceRequiredFields?: boolean

  /**
   * Format of schema export. groq-type-nodes is the only avilable format at the moment
   */
  format?: string

  /**
   * Telemetry logger for the Sanity CLI tooling. If no logger is provided no telemetry
   * is sent. Also, no telemetry will be sent if telemetry is disabled in the sanity CLI.
   */
  telemetryLogger?: CliCommandContext['telemetry']
}

/**
 * Creates a Vite plugin that automatically extracts Sanity schema during development and build.
 *
 * **During development:**
 * The plugin performs an initial extraction when the dev server starts, then watches
 * for file changes and re-extracts the schema when relevant files are modified.
 *
 * **During build:**
 * The plugin extracts the schema once at the end of the build process, ensuring
 * the schema is always up-to-date when deploying.
 *
 * **How it works in dev mode:**
 * 1. Registers watch patterns with Vite's built-in file watcher
 * 2. Performs initial schema extraction when the server starts
 * 3. On file changes matching the patterns, triggers a debounced extraction
 * 4. Uses concurrency control to prevent overlapping extractions
 *
 * @param options - Configuration options for the plugin
 * @returns A Vite plugin configured for schema extraction
 *
 * @internal
 */
export function sanitySchemaExtractionPlugin(options: SchemaExtractionPluginOptions = {}) {
  const {
    workDir: workDirOption,
    outputPath: outputPathOption = 'schema.json',
    output = console,
    workspaceName,
    additionalPatterns = [],
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enforceRequiredFields = false,
    telemetryLogger,
    format = 'groq-type-nodes',
  } = options

  const watchPatterns = [...DEFAULT_SCHEMA_PATTERNS, ...additionalPatterns]

  // Resolved after Vite config is available
  let resolvedWorkDir: string
  let resolvedOutputPath: string

  // State for concurrency control
  let isExtracting = false
  let pendingExtraction = false

  // Stats for telemetry
  const startTime = Date.now()
  const stats: {successfulDurations: number[]; failedCount: number} = {
    successfulDurations: [],
    failedCount: 0,
  }

  const extractSchema = () =>
    extractSchemaToFile({
      workDir: resolvedWorkDir,
      outputPath: resolvedOutputPath,
      workspaceName,
      enforceRequiredFields,
      format,
    })

  /**
   * Runs extraction with concurrency control.
   * If extraction is already running, queues one more extraction to run after completion.
   */
  async function runExtraction(isBuilding = false): Promise<void> {
    if (isExtracting) {
      pendingExtraction = true
      return
    }

    isExtracting = true
    pendingExtraction = false

    const extractionStartTime = Date.now()
    try {
      await extractSchema()
      if (isBuilding) {
        // TODO: Remove when we have better control over progress reporting in build
        output.log('')
      }
      output.log(logSymbols.success, `Extracted schema to ${outputPathOption}`)

      // add stats for the successful extraction run to use later for telemetry
      stats.successfulDurations.push(Date.now() - extractionStartTime)
    } catch (err) {
      output.log(
        logSymbols.error,
        `Extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      )
      if (err instanceof SchemaExtractionError && err.validation && err.validation.length > 0) {
        output.log(logSymbols.error, formatSchemaValidation(err.validation))
      }

      // track the failed extraction
      stats.failedCount++
    } finally {
      isExtracting = false

      // If a change came in during extraction, run again
      if (pendingExtraction) {
        pendingExtraction = false
        await runExtraction()
      }
    }
  }

  const debouncedExtract = debounce(() => {
    void runExtraction()
  }, debounceMs)

  // Create a matcher function from all watch patterns
  const isMatch = picomatch(watchPatterns)

  return {
    name: 'sanity/schema-extraction',

    configResolved(config) {
      // Resolve workDir from option or Vite's project root
      resolvedWorkDir = workDirOption ?? config.root

      if (isAbsolute(outputPathOption)) {
        resolvedOutputPath = outputPathOption
      } else {
        resolvedOutputPath = path.join(resolvedWorkDir, outputPathOption)
      }
    },

    configureServer(server) {
      const trace = telemetryLogger?.trace(SchemaExtractionWatchModeTrace)
      trace?.start()

      trace?.log({step: 'started', enforceRequiredFields, schemaFormat: format})

      // Add schema patterns to Vite's watcher
      const absolutePatterns = watchPatterns.map((pattern) => path.join(resolvedWorkDir, pattern))
      server.watcher.add(absolutePatterns)

      // Listen for file changes
      const handleChange = (filePath: string) => {
        const relativePath = path.isAbsolute(filePath)
          ? path.relative(resolvedWorkDir, filePath)
          : filePath
        if (isMatch(relativePath)) {
          debouncedExtract()
        }
      }

      // Prepare function to log "stopped" event to trace and complete the trace
      const onClose = once(() => {
        if (!trace) {
          return
        }
        trace.log({
          step: 'stopped',
          watcherDuration: Date.now() - startTime,
          extractionSuccessfulCount: stats.successfulDurations.length,
          extractionFailedCount: stats.failedCount,
          averageExtractionDuration: mean(stats.successfulDurations),
        })
        trace.complete()
      })

      server.watcher.on('change', handleChange)
      server.watcher.on('add', handleChange)
      server.watcher.on('unlink', handleChange)

      // call the watcherClosed method when watcher is closed or when process is stopped/killed
      server.watcher.on('close', onClose)
      process.on('SIGTERM', onClose)
      process.on('SIGINT', onClose)

      // Run initial extraction after server is ready
      const startExtraction = () => {
        setTimeout(() => {
          // Notify about schema extraction enabled
          output.info(logSymbols.info, 'Schema extraction enabled. Watching:')
          for (const pattern of watchPatterns) {
            output.info(`  - ${pattern}`)
          }

          // Perform first extraction
          void runExtraction()
        }, INITIAL_EXTRACTION_DELAY_MS)
      }

      if (server.httpServer) {
        server.httpServer.once('listening', startExtraction)
      } else {
        // Middleware mode - no HTTP server, run extraction immediately
        startExtraction()
      }
    },

    async buildEnd() {
      const trace = telemetryLogger?.trace(SchemaExtractedTrace)
      trace?.start()

      try {
        const start = Date.now()
        const schema = await extractSchema()
        console.error(`✓ Extract schema (${Date.now() - start}ms)`)

        trace?.log({
          schemaAllTypesCount: schema.length,
          schemaDocumentTypesCount: schema.filter((type) => type.type === 'document').length,
          schemaTypesCount: schema.filter((type) => type.type === 'type').length,
          enforceRequiredFields,
          schemaFormat: format,
        })
      } catch (err) {
        trace?.error(err)
        throw err
      } finally {
        trace?.complete()
      }
    },
  } satisfies Plugin
}
