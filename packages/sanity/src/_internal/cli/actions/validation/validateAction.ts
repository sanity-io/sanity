import type {CliCommandArguments, CliCommandContext, CliOutputter} from '@sanity/cli'
import logSymbols from 'log-symbols'
import chalk from 'chalk'
import type {WorkerChannelReceiver} from '../../util/workerChannels'
import type {ValidationWorkerChannel} from '../../threads/validateDocuments'
import {validateDocuments} from './validateDocuments'
import {reporters} from './reporters'

interface ValidateFlags {
  workspace?: string
  format?: string
  dataset?: string
  level?: 'error' | 'warning' | 'info'
  'max-custom-validation-concurrency'?: number
  yes?: boolean
  y?: boolean
}

export type BuiltInValidationReporter = (options: {
  output: CliOutputter
  worker: WorkerChannelReceiver<ValidationWorkerChannel>
  flags: ValidateFlags
}) => Promise<'error' | 'warning' | 'info'>

export default async function validateAction(
  args: CliCommandArguments<ValidateFlags>,
  {apiClient, workDir, output, prompt}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const unattendedMode = Boolean(flags.yes || flags.y)

  if (!unattendedMode) {
    output.print(
      `${chalk.yellow(
        `${logSymbols.warning} Warning:`,
      )} This command downloads all documents from a ` +
        `dataset and processes them through your local schema within a ` +
        `simulated browser environment.\n`,
    )
    output.print(`Potential pitfalls:\n`)
    output.print(
      `- Downloads all documents locally (excluding assets). Large datasets may require more resources.`,
    )
    output.print(
      `- Executes all custom validation functions. Some functions may need to be refactored for compatibility.`,
    )
    output.print(
      `- Not all standard browser features are available and may cause issues while loading your Studio.`,
    )
    output.print(
      `- Adheres to document permissions. Ensure this account can see all desired documents.`,
    )
    output.print()
    output.print(
      "Note: As it's currently in beta, we encourage users to report any issues encountered here:\n",
    )
    output.print('    https://github.com/sanity-io/sanity/issues/5510')
    output.print()

    const confirmed = await prompt.single<boolean>({
      type: 'confirm',
      message: `Are you sure you want to continue?`,
      default: true,
    })

    if (!confirmed) {
      output.print('User aborted')
      process.exitCode = 1
      return
    }
  }

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
