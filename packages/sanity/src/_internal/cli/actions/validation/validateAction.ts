import {CliCommandArguments, CliCommandContext, CliOutputter} from '@sanity/cli'
import {WorkerChannelReceiver} from '../../util/workerChannels'
import type {ValidationWorkerChannel} from '../../threads/validateDocuments'
import {validateDocuments} from './validateDocuments'
import {reporters} from './reporters'

interface ValidateFlags {
  workspace?: string
  format?: string
  dataset?: string
  level?: 'error' | 'warning' | 'info'
  'max-custom-validation-concurrency'?: number
}

export type BuiltInValidationReporter = (options: {
  output: CliOutputter
  worker: WorkerChannelReceiver<ValidationWorkerChannel>
  flags: ValidateFlags
}) => Promise<'error' | 'warning' | 'info'>

export default async function validateAction(
  args: CliCommandArguments<ValidateFlags>,
  {apiClient, workDir, output}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions

  if (flags.format && !(flags.format in reporters)) {
    const formatter = new Intl.ListFormat('en-US', {
      style: 'long',
      type: 'conjunction',
    })
    throw new Error(
      `Did not recognize format '${flags.format}'. Available formats are ${formatter.format(
        Object.keys(reporters).map((key) => `'${key}'`),
      )}`,
    )
  }

  const level = flags.level || 'warning'

  if (level !== 'error' && level !== 'warning' && level !== 'info') {
    throw new Error(`Invalid level. Available levels are 'error', 'warning', and 'info'.`)
  }

  const maxCustomValidationConcurrency = flags['max-custom-validation-concurrency']
  if (
    maxCustomValidationConcurrency &&
    typeof maxCustomValidationConcurrency !== 'number' &&
    !Number.isInteger(maxCustomValidationConcurrency)
  ) {
    throw new Error(`'--max-custom-validation-concurrency' must be an integer.`)
  }

  const overallLevel = await validateDocuments({
    workspace: flags.workspace,
    dataset: flags.dataset,
    clientConfig: apiClient({
      requireUser: true,
      requireProject: false, // we'll get this from the workspace
    }).config(),
    workDir,
    level,
    maxCustomValidationConcurrency,
    reporter: (worker) => {
      const reporter =
        flags.format && flags.format in reporters
          ? reporters[flags.format as keyof typeof reporters]
          : reporters.pretty

      return reporter({output, worker, flags})
    },
  })

  process.exitCode = overallLevel === 'error' ? 1 : 0
}
