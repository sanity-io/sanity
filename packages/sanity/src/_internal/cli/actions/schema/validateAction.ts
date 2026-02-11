import {writeFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import logSymbols from 'log-symbols'
import readPkgUp from 'read-pkg-up'

import {
  type ValidateSchemaWorkerData,
  type ValidateSchemaWorkerResult,
} from '../../threads/validateSchema'
import {formatSchemaValidation, getAggregatedSeverity} from './formatSchemaValidation'
import {generateMetafile} from './metafile'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface ValidateFlags {
  'workspace'?: string
  'format'?: string
  'level'?: 'error' | 'warning'
  'debug-metafile-path'?: string
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
    'validateSchema.cjs',
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
      debugSerialize: Boolean(flags['debug-metafile-path']),
    } satisfies ValidateSchemaWorkerData,
    env: process.env,
  })

  const {validation, serializedDebug} = await new Promise<ValidateSchemaWorkerResult>(
    (resolve, reject) => {
      worker.addListener('message', resolve)
      worker.addListener('error', reject)
    },
  )

  const problems = validation.flatMap((group) => group.problems)
  const errorCount = problems.filter((problem) => problem.severity === 'error').length
  const warningCount = problems.filter((problem) => problem.severity === 'warning').length

  const overallSeverity = getAggregatedSeverity(validation)
  const didFail = overallSeverity === 'error'

  if (flags['debug-metafile-path'] && !didFail) {
    if (!serializedDebug) throw new Error('serializedDebug should always be produced')
    const metafile = generateMetafile(serializedDebug)
    writeFileSync(flags['debug-metafile-path'], JSON.stringify(metafile), 'utf8')
  }

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

      if (flags['debug-metafile-path']) {
        output.print()
        if (didFail) {
          output.print(`${logSymbols.info} Metafile not written due to validation errors`)
        } else {
          output.print(`${logSymbols.info} Metafile written to: ${flags['debug-metafile-path']}`)
          output.print(`  This can be analyzed at https://esbuild.github.io/analyze/`)
        }
      }
    }
  }

  process.exitCode = didFail ? 1 : 0
}
