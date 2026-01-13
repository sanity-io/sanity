import {join} from 'node:path'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {promiseWithResolvers} from '../../util/promiseWithResolvers'
import {SchemaExtractedTrace, SchemaExtractionWatchModeTrace} from './extractSchema.telemetry'
import {formatSchemaValidation} from './formatSchemaValidation'
import {
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_WATCH_PATTERNS,
  extractSchemaToFile,
  SchemaExtractionError,
  startSchemaWatcher,
} from './schemaExtractorApi'

interface ExtractFlags {
  'workspace'?: string
  'path'?: string
  'enforce-required-fields'?: boolean
  'format'?: 'groq-type-nodes' | string
  'watch'?: boolean
  'watch-path'?: string | string[]
  'debounce'?: number
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

/**
 * Runs a single extraction with spinner and telemetry (original behavior).
 */
async function runSingleExtraction(
  args: CliCommandArguments<ExtractFlags>,
  {workDir, output, telemetry}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const format = flags.format || 'groq-type-nodes'
  const enforceRequiredFields = flags['enforce-required-fields'] || false
  const outputPath = flags.path || join(workDir, 'schema.json')

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
      workspaceName: flags.workspace,
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
  {workDir, output, telemetry}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const format = flags.format || 'groq-type-nodes'
  const enforceRequiredFields = flags['enforce-required-fields'] || false
  const outputPath = flags.path || join(workDir, 'schema.json')

  // Build watch patterns
  const additionalPaths = flags['watch-path']
  const additionalPatterns = Array.isArray(additionalPaths)
    ? additionalPaths
    : additionalPaths
      ? [additionalPaths]
      : []
  const watchPatterns = [...DEFAULT_WATCH_PATTERNS, ...additionalPatterns]

  const debounceMs = flags.debounce ?? DEFAULT_DEBOUNCE_MS

  const trace = telemetry.trace(SchemaExtractionWatchModeTrace)
  trace.start()

  // Print watch mode header and patterns at the very beginning
  output.print('Schema extraction watch mode')
  output.print(`Debounce: ${debounceMs}ms`)
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
    workspaceName: flags.workspace,
    enforceRequiredFields,
    format,
    patterns: watchPatterns,
    debounceMs,
    onExtraction: (result) => trace.log({step: 'extracted', success: result.success}),
  })

  output.print('')
  output.print('Watching for changes... (Ctrl+C to stop)')

  const {resolve, promise} = promiseWithResolvers<void>()

  // Handle graceful shutdown
  const cleanup = () => {
    trace.log({step: 'stopped'})
    trace.complete()

    output.print('')
    output.print('Stopping watch mode...')
    void stop()
    resolve()
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Keep process alive
  await promise
}
