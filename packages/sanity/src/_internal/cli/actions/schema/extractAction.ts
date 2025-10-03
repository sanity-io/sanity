import {writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
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
    'extractSchema.js',
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
      try {
        // Re-resolve config in-process to surface validation details
        await getStudioWorkspaces({basePath: workDir})
      } catch (innerErr) {
        const validation = extractValidationFromCoreSchemaError(innerErr)
        if (validation && validation.length > 0) {
          output.print('')
          output.print(formatSchemaValidation(validation))
        }
        throw err
      }
    }
    throw err
  }
}

function extractValidationFromCoreSchemaError(
  error: unknown,
): SchemaValidationProblemGroup[] | null {
  if (!(error instanceof CoreSchemaError)) return null
  const schema: unknown = error.schema
  if (!schema || typeof schema !== 'object') return null
  const v = (schema as Record<string, unknown>)._validation
  if (!Array.isArray(v)) return null
  const isValid = v.every((group) => {
    if (typeof group !== 'object' || group === null) return false
    const g = group as Record<string, unknown>
    return Array.isArray(g.path) && Array.isArray(g.problems)
  })
  return isValid ? (v as SchemaValidationProblemGroup[]) : null
}

function isSchemaError(err: unknown): err is {name: string} {
  if (typeof err !== 'object' || err === null) return false
  const obj = err as Record<string, unknown>
  const name = typeof obj.name === 'string' ? obj.name : undefined
  const message = typeof (obj as any).message === 'string' ? (obj as any).message : undefined
  return name === 'SchemaError' || message === 'SchemaError'
}
