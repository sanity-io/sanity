import path from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import logSymbols from 'log-symbols'
import readPkgUp from 'read-pkg-up'

import {
  type ValidateSchemaWorkerData,
  type ValidateSchemaWorkerResult,
} from '../../threads/validateSchema'
import {formatSchemaValidation, getAggregatedSeverity} from './formatSchemaValidation'

interface ValidateFlags {
  workspace?: string
  format?: string
  level?: 'error' | 'warning'
}

export type SchemaValidationFormatter = (result: ValidateSchemaWorkerResult) => string

export default async function validateAction(
  args: CliCommandArguments<ValidateFlags>,
  {workDir, output}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions

  const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
  if (!rootPkgPath) {
    throw new Error('Could not find root directory for `sanity` package')
  }

  const workerPath = path.join(
    path.dirname(rootPkgPath),
    'lib',
    '_internal',
    'cli',
    'threads',
    'validateSchema.js',
  )

  const level = flags.level || 'warning'

  if (level !== 'error' && level !== 'warning') {
    throw new Error(`Invalid level. Available levels are 'error' and 'warning'.`)
  }

  const format = flags.format || 'pretty'

  if (!['pretty', 'ndjson', 'json'].includes(format)) {
    throw new Error(
      `Did not recognize format '${flags.format}'. Available formats are 'pretty', 'ndjson', and 'json'.`,
    )
  }

  let spinner

  if (format === 'pretty') {
    spinner = output
      .spinner(
        flags.workspace
          ? `Validating schema from workspace '${flags.workspace}'…`
          : 'Validating schema…',
      )
      .start()
  }

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      level,
      workspace: flags.workspace,
    } satisfies ValidateSchemaWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  const {validation} = await new Promise<ValidateSchemaWorkerResult>((resolve, reject) => {
    worker.addListener('message', resolve)
    worker.addListener('error', reject)
  })

  const problems = validation.flatMap((group) => group.problems)
  const errorCount = problems.filter((problem) => problem.severity === 'error').length
  const warningCount = problems.filter((problem) => problem.severity === 'warning').length

  const overallSeverity = getAggregatedSeverity(validation)

  switch (format) {
    case 'ndjson': {
      for (const group of validation) {
        output.print(JSON.stringify(group))
      }
      break
    }
    case 'json': {
      output.print(JSON.stringify(validation))
      break
    }
    default: {
      spinner?.succeed('Validated schema')
      output.print(`\nValidation results:`)
      output.print(
        `${logSymbols.error} Errors:   ${errorCount.toLocaleString('en-US')} error${
          errorCount === 1 ? '' : 's'
        }`,
      )
      if (level !== 'error') {
        output.print(
          `${logSymbols.warning} Warnings: ${warningCount.toLocaleString('en-US')} warning${
            warningCount === 1 ? '' : 's'
          }`,
        )
      }
      output.print()

      output.print(formatSchemaValidation(validation))
    }
  }

  process.exitCode = overallSeverity === 'error' ? 1 : 0
}
