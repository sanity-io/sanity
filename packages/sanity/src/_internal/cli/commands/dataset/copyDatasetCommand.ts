import type {SanityClient} from '@sanity/client'
import type {CliCommandDefinition, CliOutputter} from '@sanity/cli'
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import EventSource from '@sanity/eventsource'
import {Observable} from 'rxjs'
import {promptForDatasetName} from '../../actions/dataset/datasetNamePrompt'
import {validateDatasetName} from '../../actions/dataset/validateDatasetName'
import {debug} from '../../debug'
import {listDatasetCopyJobs} from '../../actions/dataset/listDatasetCopyJobs'
import {getClientUrl} from '../../util/getClientUrl'

const helpText = `
Options
  --detach Start the copy without waiting for it to finish
  --attach <job-id> Attach to the running copy process to show progress
  --skip-history Don't preserve document history on copy
  --list Lists all dataset copy jobs corresponding to a certain criteria.
  --offset Start position in the list of jobs. Default 0. With --list.
  --limit Maximum number of jobs returned. Default 10. Maximum 1000. With --list.

Examples
  sanity dataset copy
  sanity dataset copy <source-dataset>
  sanity dataset copy <source-dataset> <target-dataset>
  sanity dataset copy <source-dataset> <target-dataset> --skip-history 
  sanity dataset copy <source-dataset> <target-dataset> --detach 
  sanity dataset copy --attach <job-id>
  sanity dataset copy --list
  sanity dataset copy --list --offset=2
  sanity dataset copy --list --offset=2 --limit=10
`

interface CopyProgressStreamEvent {
  type: 'reconnect' | string
  progress?: number
}

interface CopyDatasetFlags {
  list?: boolean
  attach?: string
  detach?: boolean
  offset?: number
  limit?: number
  'skip-history'?: boolean
}

interface CopyDatasetResponse {
  jobId: string
}

function parseCliFlags(args: {argv?: string[]}) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .option('attach', {type: 'string'})
    .option('list', {type: 'boolean'})
    .option('limit', {type: 'number'})
    .option('offset', {type: 'number'})
    .option('skip-history', {type: 'boolean'})
    .option('detach', {type: 'boolean'}).argv
}

const progress = (url: string) => {
  return new Observable<CopyProgressStreamEvent>((observer) => {
    let progressSource = new EventSource(url)
    let stopped = false

    function onError(error: unknown) {
      if (progressSource) {
        progressSource.close()
      }

      debug(`Error received: ${error}`)
      if (stopped) {
        return
      }
      observer.next({type: 'reconnect'})
      progressSource = new EventSource(url)
    }

    function onChannelError(error: MessageEvent) {
      stopped = true
      progressSource.close()
      observer.error(error)
    }

    function onMessage(event: MessageEvent) {
      const data = JSON.parse(event.data)
      if (data.state === 'failed') {
        debug('Job failed. Data: %o', event)
        observer.error(event)
      } else if (data.state === 'completed') {
        debug('Job succeeded. Data: %o', event)
        onComplete()
      } else {
        debug(`Job progressed. Data: %o`, event)
        observer.next(data)
      }
    }

    function onComplete() {
      progressSource.removeEventListener('error', onError)
      progressSource.removeEventListener('channel_error', onChannelError)
      progressSource.removeEventListener('job', onMessage)
      progressSource.removeEventListener('done', onComplete)
      progressSource.close()
      observer.complete()
    }

    progressSource.addEventListener('error', onError)
    progressSource.addEventListener('channel_error', onChannelError)
    progressSource.addEventListener('job', onMessage)
    progressSource.addEventListener('done', onComplete)
  })
}

const followProgress = (
  jobId: string,
  client: SanityClient,
  output: CliOutputter,
): Promise<void> => {
  let currentProgress = 0

  const spinner = output.spinner({}).start()
  const listenUrl = getClientUrl(client, `jobs/${jobId}/listen`)

  debug(`Listening to ${listenUrl}`)

  return new Promise((resolve, reject) => {
    progress(listenUrl).subscribe({
      next: (event) => {
        if (typeof event.progress === 'number') {
          currentProgress = event.progress
        }

        spinner.text = `Copy in progress: ${currentProgress}%`
      },
      error: (err) => {
        spinner.fail()
        reject(new Error(`${err.data}`))
      },
      complete: () => {
        spinner.succeed('Copy finished.')
        resolve()
      },
    })
  })
}

const copyDatasetCommand: CliCommandDefinition<CopyDatasetFlags> = {
  name: 'copy',
  group: 'dataset',
  signature: '[SOURCE_DATASET] [TARGET_DATASET]',
  helpText,
  description:
    'Manages dataset copying, including starting a new copy job, listing copy jobs and following the progress of a running copy job',
  action: async (args, context) => {
    const {apiClient, output, prompt, chalk} = context
    // Reparsing CLI flags for better control of binary flags
    const flags: CopyDatasetFlags = await parseCliFlags(args)
    const client = apiClient()

    if (flags.list) {
      await listDatasetCopyJobs(flags, context)
      return
    }

    if (flags.attach) {
      const jobId = flags.attach

      if (!jobId) {
        throw new Error('Please supply a jobId')
      }

      await followProgress(jobId, client, output)
      return
    }

    const [sourceDataset, targetDataset] = args.argsWithoutOptions
    const shouldSkipHistory = Boolean(flags['skip-history'])

    const nameError = sourceDataset && validateDatasetName(sourceDataset)
    if (nameError) {
      throw new Error(nameError)
    }

    const existingDatasets = await client.datasets
      .list()
      .then((datasets) => datasets.map((ds) => ds.name))

    const sourceDatasetName = await (sourceDataset ||
      promptForDatasetName(prompt, {message: 'Source dataset name:'}))
    if (!existingDatasets.includes(sourceDatasetName)) {
      throw new Error(`Source dataset "${sourceDatasetName}" doesn't exist`)
    }

    const targetDatasetName = await (targetDataset ||
      promptForDatasetName(prompt, {message: 'Target dataset name:'}))
    if (existingDatasets.includes(targetDatasetName)) {
      throw new Error(`Target dataset "${targetDatasetName}" already exists`)
    }

    const err = validateDatasetName(targetDatasetName)
    if (err) {
      throw new Error(err)
    }

    try {
      const response = await client.request<CopyDatasetResponse>({
        method: 'PUT',
        uri: `/datasets/${sourceDatasetName}/copy`,
        body: {
          targetDataset: targetDatasetName,
          skipHistory: shouldSkipHistory,
        },
      })

      output.print(
        `Copying dataset ${chalk.green(sourceDatasetName)} to ${chalk.green(targetDatasetName)}...`,
      )

      if (!shouldSkipHistory) {
        output.print(
          `Note: You can run this command with flag '--skip-history'. The flag will reduce copy time in larger datasets.`,
        )
      }

      output.print(`Job ${chalk.green(response.jobId)} started`)

      if (flags.detach) {
        return
      }

      await followProgress(response.jobId, client, output)
      output.print(`Job ${chalk.green(response.jobId)} completed`)
    } catch (error) {
      if (error.statusCode) {
        output.print(`${chalk.red(`Dataset copying failed:\n${error.response.body.message}`)}\n`)
      } else {
        output.print(`${chalk.red(`Dataset copying failed:\n${error.message}`)}\n`)
      }
    }
  },
}

export default copyDatasetCommand
