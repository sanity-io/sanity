import {writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {Worker} from 'node:worker_threads'

import {type CliOutputter} from '@sanity/cli'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import {type FSWatcher} from 'chokidar'
import {type SchemaType} from 'groq-js'
import readPkgUp from 'read-pkg-up'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerMessage,
} from '../../threads/extractSchema'
import {formatSchemaValidation} from './formatSchemaValidation'
import {createSchemaWatcher, DEFAULT_WATCH_PATTERNS} from './watchExtract'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Error thrown when schema extraction fails, includes validation details if available */
export class SchemaExtractionError extends Error {
  validation?: SchemaValidationProblemGroup[]

  constructor(message: string, validation?: SchemaValidationProblemGroup[]) {
    super(message)
    this.name = 'SchemaExtractionError'
    this.validation = validation
  }
}

/** Options for extracting schema to a file */
export interface ExtractSchemaOptions {
  workDir: string
  outputPath: string
  workspaceName?: string
  enforceRequiredFields?: boolean
  format?: string
}

interface OnExtractionCallbackData {
  success: boolean
  schema?: SchemaType
  duration: number
}

/**
 * Extracts schema to a file. Runs in a worker thread for isolation. Returns the extracted schema
 * after the extraction has completed and the file has been written to the file.
 *
 * Throws SchemaExtractionError with validation details if extraction fails.
 */
export async function extractSchemaToFile(options: ExtractSchemaOptions) {
  const {
    workDir,
    outputPath,
    workspaceName,
    enforceRequiredFields = false,
    format = 'groq-type-nodes',
  } = options

  const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
  if (!rootPkgPath) {
    throw new Error('Could not find root directory for `sanity` package')
  }

  const workerPath = join(
    dirname(rootPkgPath),
    'lib',
    '_internal',
    'cli',
    'threads',
    'extractSchema.cjs',
  )

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      workspaceName,
      enforceRequiredFields,
      format,
    } satisfies ExtractSchemaWorkerData,
    env: process.env,
  })

  const message = await new Promise<ExtractSchemaWorkerMessage>((resolve, reject) => {
    worker.addListener('message', resolve)
    worker.addListener('error', reject)
  })

  if (message.type === 'error') {
    throw new SchemaExtractionError(message.error, message.validation)
  }

  await writeFile(outputPath, `${JSON.stringify(message.schema, null, 2)}\n`)

  return message.schema
}

/** Options for starting a schema watcher */
export interface SchemaWatcherOptions {
  workDir: string
  outputPath: string
  output: CliOutputter
  workspaceName?: string
  enforceRequiredFields?: boolean
  format?: string
  patterns?: string[]
  debounceMs?: number

  /** Optional callback function for listening in on the schema extraction */
  onExtraction?: (result: OnExtractionCallbackData) => void
}

/** Result from starting a schema watcher */
export interface SchemaWatcherResult {
  /** Call to stop the watcher */
  stop: () => Promise<void>
  /** The underlying FSWatcher instance */
  watcher: FSWatcher
}

/**
 * Starts a schema watcher that extracts schema on file changes.
 * Runs an initial extraction before starting to watch.
 * Returns a cleanup function to stop the watcher.
 */
export async function startSchemaWatcher(
  options: SchemaWatcherOptions,
): Promise<SchemaWatcherResult> {
  const {
    workDir,
    outputPath,
    output,
    workspaceName,
    enforceRequiredFields = false,
    format = 'groq-type-nodes',
    patterns = DEFAULT_WATCH_PATTERNS,
    onExtraction,
  } = options

  // Helper to run extraction with spinner and error display
  const runExtraction = async (spinnerText: string, successText: string): Promise<boolean> => {
    const spinner = output.spinner({}).start(spinnerText)
    const startTime = Date.now()

    try {
      const schema = await extractSchemaToFile({
        workDir,
        outputPath,
        workspaceName,
        enforceRequiredFields,
        format,
      })

      onExtraction?.({success: true, schema, duration: Date.now() - startTime})
      spinner.succeed(successText)
      return true
    } catch (err) {
      onExtraction?.({success: false, duration: Date.now() - startTime})
      spinner.fail(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`)
      if (err instanceof SchemaExtractionError && err.validation && err.validation.length > 0) {
        output.print('')
        output.print(formatSchemaValidation(err.validation))
      }
      return false
    }
  }

  // Run initial extraction
  await runExtraction('Extracting schema...', `Extracted schema to ${outputPath}`)

  // Create extraction callback for watch mode
  const onExtract = async () => {
    await runExtraction('Extracting schema...', `Extracted schema to ${outputPath}`)
  }

  // Start watcher
  const watcher = await createSchemaWatcher({
    workDir,
    patterns,
    onExtract,
    output,
  })

  const stop = async () => {
    await watcher.close()
  }

  return {stop, watcher}
}

export {DEFAULT_WATCH_PATTERNS}
