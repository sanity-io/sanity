import {writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import readPkgUp from 'read-pkg-up'
import {SchemaError as CoreSchemaError} from 'sanity'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'
import {getStudioWorkspaces} from '../../util/getStudioWorkspaces'
import {SchemaExtractedTrace} from './extractSchema.telemetry'
import {formatSchemaValidation} from './formatSchemaValidation'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ExtractFlags {
  'workspace'?: string
  'path'?: string
  'enforce-required-fields'?: boolean
  'format'?: 'groq-type-nodes' | string
}

export type SchemaValidationFormatter = (result: ExtractSchemaWorkerResult) => string

export default async function extractAction(
  args: CliCommandArguments<ExtractFlags>,
  {workDir, output, telemetry}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const formatFlag = flags.format || 'groq-type-nodes'
  const enforceRequiredFields = flags['enforce-required-fields'] || false

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

  const spinner = output
    .spinner({})
    .start(
      enforceRequiredFields
        ? 'Extracting schema, with enforced required fields'
        : 'Extracting schema',
    )

  const trace = telemetry.trace(SchemaExtractedTrace)
  trace.start()

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      workspaceName: flags.workspace,
      enforceRequiredFields,
      format: formatFlag,
    } satisfies ExtractSchemaWorkerData,
    env: process.env,
  })

  try {
    const {schema} = await new Promise<ExtractSchemaWorkerResult>((resolve, reject) => {
      worker.addListener('message', resolve)
      worker.addListener('error', reject)
    })

    trace.log({
      schemaAllTypesCount: schema.length,
      schemaDocumentTypesCount: schema.filter((type) => type.type === 'document').length,
      schemaTypesCount: schema.filter((type) => type.type === 'type').length,
      enforceRequiredFields,
      schemaFormat: formatFlag,
    })

    const path = flags.path || join(process.cwd(), 'schema.json')

    spinner.text = `Writing schema to ${path}`

    await writeFile(path, `${JSON.stringify(schema, null, 2)}\n`)

    trace.complete()

    spinner.succeed(
      enforceRequiredFields
        ? `Extracted schema to ${path} with enforced required fields`
        : `Extracted schema to ${path}`,
    )
  } catch (err) {
    trace.error(err)
    spinner.fail(
      enforceRequiredFields
        ? 'Failed to extract schema, with enforced required fields'
        : 'Failed to extract schema',
    )

    if (isSchemaError(err)) {
      let validation: SchemaValidationProblemGroup[] | null = null

      // First, try to extract validation details from the original error
      // (works when the error is a CoreSchemaError with embedded validation)
      validation = extractValidationFromCoreSchemaError(err)

      // If that didn't work, try re-resolving the config in-process
      // to trigger the same error and capture validation details
      if (!validation || validation.length === 0) {
        try {
          await getStudioWorkspaces({basePath: workDir})
        } catch (innerErr) {
          validation = extractValidationFromCoreSchemaError(innerErr)
        }
      }

      // Print validation details if we found any
      if (validation && validation.length > 0) {
        output.print('')
        output.print(formatSchemaValidation(validation))
      } else {
        // Fallback: tell the user how to get more details
        output.print('')
        output.print('Run `sanity schema validate` for detailed information about schema errors.')
      }
    }
    throw err
  }
}

/**
 * Type guard to check if an item conforms to the SchemaValidationProblemGroup shape.
 */
function isValidationProblemGroup(item: unknown): item is SchemaValidationProblemGroup {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  const group = item as Record<string, unknown>
  return Array.isArray(group.path) && Array.isArray(group.problems)
}

/**
 * Extracts the `_validation` array from a CoreSchemaError's internal schema object.
 *
 * CoreSchemaError stores the compiled schema (which includes validation results) on
 * `error.schema._validation`. This function safely navigates that structure and validates
 * it conforms to the expected `SchemaValidationProblemGroup[]` shape before returning.
 */
function extractValidationFromCoreSchemaError(
  error: unknown,
): SchemaValidationProblemGroup[] | null {
  if (!(error instanceof CoreSchemaError)) {
    return null
  }

  const schema = error.schema as unknown as Record<string, unknown> | null | undefined
  if (!schema || typeof schema !== 'object') {
    return null
  }

  const validation = schema._validation
  if (!Array.isArray(validation)) {
    return null
  }

  if (!validation.every(isValidationProblemGroup)) {
    return null
  }

  return validation
}

/**
 * Type guard for SchemaError. Checks both `name` and `message` properties because
 * errors from worker threads lose their prototype chain during serialization,
 * and may only preserve the error name in the message string.
 */
function isSchemaError(err: unknown): err is Error & {name: 'SchemaError'} {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  const errorLike = err as {name?: unknown; message?: unknown}
  const hasSchemaErrorName = errorLike.name === 'SchemaError'
  const hasSchemaErrorMessage = errorLike.message === 'SchemaError'

  return hasSchemaErrorName || hasSchemaErrorMessage
}
