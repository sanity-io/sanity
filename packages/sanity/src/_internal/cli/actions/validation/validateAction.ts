import fs from 'node:fs'
import path from 'node:path'

import {
  type CliCommandArguments,
  type CliCommandContext,
  type CliConfig,
  type CliOutputter,
} from '@sanity/cli'
import {type ClientConfig} from '@sanity/client'
import chalk from 'chalk'
import logSymbols from 'log-symbols'

import {type ValidationWorkerChannel} from '../../threads/validateDocuments'
import {type WorkerChannelReceiver} from '../../util/workerChannels'
import {reporters} from './reporters'
import {validateDocuments} from './validateDocuments'

interface ValidateFlags {
  'workspace'?: string
  'format'?: string
  'dataset'?: string
  'file'?: string
  'level'?: 'error' | 'warning' | 'info'
  'max-custom-validation-concurrency'?: number
  'max-fetch-concurrency'?: number
  'yes'?: boolean
  'y'?: boolean
}

export type BuiltInValidationReporter = (options: {
  output: CliOutputter
  worker: WorkerChannelReceiver<ValidationWorkerChannel>
  flags: ValidateFlags
}) => Promise<'error' | 'warning' | 'info'>

export default async function validateAction(
  args: CliCommandArguments<ValidateFlags>,
  {apiClient, workDir, output, cliConfig, prompt}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const unattendedMode = Boolean(flags.yes || flags.y)

  if (!unattendedMode) {
    output.print(
      `${chalk.yellow(`${logSymbols.warning} Warning:`)} This command ${
        flags.file
          ? 'reads all documents from your input file'
          : 'downloads all documents from your dataset'
      } and processes them through your local schema within a ` +
        `simulated browser environment.\n`,
    )
    output.print(`Potential pitfalls:\n`)
    output.print(
      `- Processes all documents locally (excluding assets). Large datasets may require more resources.`,
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
    if (flags.file) {
      output.print(
        `- Checks for missing document references against the live dataset if not found in your file.`,
      )
    }

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

  const maxFetchConcurrency = flags['max-fetch-concurrency']
  if (
    maxFetchConcurrency &&
    typeof maxFetchConcurrency !== 'number' &&
    !Number.isInteger(maxFetchConcurrency)
  ) {
    throw new Error(`'--max-fetch-concurrency' must be an integer.`)
  }

  const clientConfig: Partial<ClientConfig> = {
    ...apiClient({
      requireUser: true,
      requireProject: false, // we'll get this from the workspace
    }).config(),
    // we set this explictly to true because the default client configuration
    // from the CLI comes configured with `useProjectHostname: false` when
    // `requireProject` is set to false
    useProjectHostname: true,
    // we set this explictly to true because we pass in a token via the
    // `clientConfiguration` object and also mock a browser environment in
    // this worker which triggers the browser warning
    ignoreBrowserTokenWarning: true,
  }

  let ndjsonFilePath
  if (flags.file) {
    if (typeof flags.file !== 'string') {
      throw new Error(`'--file' must be a string`)
    }
    const filePath = path.resolve(workDir, flags.file)

    const stat = await fs.promises.stat(filePath)
    if (!stat.isFile()) {
      throw new Error(`'--file' must point to a valid ndjson file or tarball`)
    }

    ndjsonFilePath = filePath
  }

  const overallLevel = await validateDocuments({
    workspace: flags.workspace,
    dataset: flags.dataset,
    clientConfig,
    workDir,
    level,
    maxCustomValidationConcurrency,
    maxFetchConcurrency,
    ndjsonFilePath,
    reporter: (worker) => {
      const reporter =
        flags.format && flags.format in reporters
          ? reporters[flags.format as keyof typeof reporters]
          : reporters.pretty

      return reporter({output, worker, flags})
    },
    studioHost: (cliConfig as CliConfig)?.studioHost,
  })

  process.exitCode = overallLevel === 'error' ? 1 : 0
}
