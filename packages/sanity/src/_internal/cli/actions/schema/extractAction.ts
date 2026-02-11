import {join} from 'node:path'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {mean, once} from 'lodash-es'

import {promiseWithResolvers} from '../../util/promiseWithResolvers'
import {SchemaExtractedTrace, SchemaExtractionWatchModeTrace} from './extractSchema.telemetry'
import {formatSchemaValidation} from './formatSchemaValidation'
import {
  DEFAULT_WATCH_PATTERNS,
  extractSchemaToFile,
  SchemaExtractionError,
  startSchemaWatcher,
} from './schemaExtractorApi'

export interface ExtractFlags {
  'workspace'?: string
  'path'?: string
  'enforce-required-fields'?: boolean
  'format'?: 'groq-type-nodes' | string
  'watch'?: boolean
  'watch-patterns'?: string | string[]
}

export default async function extractAction(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions

  if (flags.watch) {
    return runWatchMode(args, context)
  }

  return runSingleExtraction(args, context)
}

export function getExtractOptions(
  flags: ExtractFlags,
  config: CliCommandContext['cliConfig'],
  workDir: string,
) {
  const schemaExtraction = config?.schemaExtraction

  return {
    workspace: flags.workspace ?? schemaExtraction?.workspace,
    format: flags.format ?? 'groq-type-nodes',
    enforceRequiredFields:
      flags['enforce-required-fields'] ?? schemaExtraction?.enforceRequiredFields ?? false,
    outputPath: flags.path ?? schemaExtraction?.path ?? join(workDir, 'schema.json'),
    watchPatterns: flags['watch-patterns']
      ? Array.isArray(flags['watch-patterns'])
        ? flags['watch-patterns']
        : [flags['watch-patterns']]
      : (schemaExtraction?.watchPatterns ?? []),
  }
}

/**
 * Runs a single extraction with spinner and telemetry (original behavior).
 */
async function runSingleExtraction(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const {workDir, output, telemetry, cliConfig} = context
  const {
    format,
    enforceRequiredFields,
    outputPath,
    workspace: workspaceName,
  } = getExtractOptions(flags, cliConfig, workDir)

  const spinner = output
    .spinner({})
    .start(
      enforceRequiredFields
        ? 'Extracting schema, with enforced required fields'
        : 'Extracting schema',
    )

  const trace = telemetry.trace(SchemaExtractedTrace)
  trace.start()

  try {
    const schema = await extractSchemaToFile({
      workDir,
      outputPath,
      workspaceName,
      enforceRequiredFields,
      format,
    })

    trace.log({
      schemaAllTypesCount: schema.length,
      schemaDocumentTypesCount: schema.filter((type) => type.type === 'document').length,
      schemaTypesCount: schema.filter((type) => type.type === 'type').length,
      enforceRequiredFields,
      schemaFormat: format,
    })

    trace.complete()

    spinner.succeed(
      enforceRequiredFields
        ? `Extracted schema to ${outputPath} with enforced required fields`
        : `Extracted schema to ${outputPath}`,
    )
  } catch (err) {
    trace.error(err)
    spinner.fail(
      enforceRequiredFields
        ? 'Failed to extract schema, with enforced required fields'
        : 'Failed to extract schema',
    )

    // Display validation errors if available
    if (err instanceof SchemaExtractionError && err.validation && err.validation.length > 0) {
      output.print('')
      output.print(formatSchemaValidation(err.validation))
    }

    throw err
  }
}

/**
 * Runs schema extraction in watch mode, re-extracting on file changes.
 */
async function runWatchMode(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions

  // Keep the start time + some simple stats for extractions as they happen
  const startTime = Date.now()
  const stats: {successfulDurations: number[]; failedCount: number} = {
    successfulDurations: [],
    failedCount: 0,
  }

  const {workDir, output, telemetry, cliConfig} = context
  const options = getExtractOptions(flags, cliConfig, workDir)
  const {
    format,
    enforceRequiredFields,
    outputPath,
    watchPatterns: additionalPatterns,
    workspace: workspaceName,
  } = options
  const watchPatterns = [...DEFAULT_WATCH_PATTERNS, ...additionalPatterns]

  const trace = telemetry.trace(SchemaExtractionWatchModeTrace)
  trace.start()

  // Print watch mode header and patterns at the very beginning
  output.print('Schema extraction watch mode')
  output.print('')
  output.print('Watching for changes in:')
  for (const pattern of watchPatterns) {
    output.print(`  - ${pattern}`)
  }
  output.print('')

  output.print('Running initial extraction...')

  // Start the watcher (includes initial extraction)
  const {stop} = await startSchemaWatcher({
    workDir,
    outputPath,
    output,
    workspaceName,
    enforceRequiredFields,
    format,
    patterns: watchPatterns,
    onExtraction: ({success, duration}) => {
      if (success) {
        stats.successfulDurations.push(duration)
      } else {
        stats.failedCount++
      }
    },
  })

  trace.log({
    step: 'started',
    enforceRequiredFields,
    schemaFormat: format,
  })

  output.print('')
  output.print('Watching for changes... (Ctrl+C to stop)')

  const {resolve, promise} = promiseWithResolvers<void>()

  /**
   * Handle graceful shutdown. Wrapped in once to prevent it being called twice by the
   * SIGINT/SIGTERM callbacks, causing double trace logs etc..
   */
  const cleanup = once(() => {
    trace.log({
      step: 'stopped',
      watcherDuration: Date.now() - startTime,
      averageExtractionDuration: mean(stats.successfulDurations),
      extractionSuccessfulCount: stats.successfulDurations.length,
      extractionFailedCount: stats.failedCount,
    })
    trace.complete()

    output.print('')
    output.print('Stopping watch mode...')
    void stop()
    resolve()
  })

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Keep process alive
  await promise
}
