import type {SanityClient} from '@sanity/client'
import type {CliCommandDefinition, CliOutputter} from '@sanity/cli'
import EventSource from '@sanity/eventsource'
import {Observable} from 'rxjs'
import {promptForDatasetName} from '../../actions/dataset/datasetNamePrompt'
import {validateDatasetName} from '../../actions/dataset/validateDatasetName'
import {debug} from '../../debug'

const helpText = `
Options
  --detach Start the copy without waiting for it to finish
  --attach <job-id> Attach to the running copy process to show progress
  --skip-history Don't preserve document history on copy

Examples
  sanity dataset copy
  sanity dataset copy <source-dataset>
  sanity dataset copy <source-dataset> <target-dataset>
  sanity dataset copy --skip-history <source-dataset> <target-dataset>
  sanity dataset copy --detach <source-dataset> <target-dataset>
  sanity dataset copy --attach <job-id>
`

interface CopyProgressStreamEvent {
  type: 'reconnect' | string
  progress?: number
}

interface CopyFlags {
  attach?: string
  detach?: boolean
  'skip-history'?: boolean
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

const followProgress = (jobId: string, client: SanityClient, output: CliOutputter) => {
  let currentProgress = 0

  const spinner = output.spinner({}).start()
  const listenUrl = client.getUrl(`jobs/${jobId}/listen`)

  debug(`Listening to ${listenUrl}`)

  progress(listenUrl).subscribe({
    next: (event) => {
      if (typeof event.progress === 'number') {
        currentProgress = event.progress
      }

      spinner.text = `Copy in progress: ${currentProgress}%`
    },
    error: (err) => {
      spinner.fail(`There was an error copying the dataset: ${err.message}`)
    },
    complete: () => {
      spinner.succeed('Copy finished.')
    },
  })
}

const copyDatasetCommand: CliCommandDefinition<CopyFlags> = {
  name: 'copy',
  group: 'dataset',
  signature: '[SOURCE_DATASET] [TARGET_DATASET]',
  helpText,
  description: 'Copies a dataset including its assets to a new dataset',
  action: async (args, context) => {
    const {apiClient, output, prompt, chalk} = context
    const flags = args.extOptions
    const client = apiClient()

    if (flags.attach) {
      const jobId = flags.attach

      if (!jobId) {
        throw new Error('Please supply a jobId')
      }

      followProgress(jobId, client, output)

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
      const response = await client.request({
        method: 'PUT',
        uri: `/datasets/${sourceDatasetName}/copy`,
        body: {
          targetDataset: targetDatasetName,
          skipHistory: shouldSkipHistory,
        },
      })

      output.print(
        `Copying dataset ${chalk.green(sourceDatasetName)} to ${chalk.green(targetDatasetName)}...`
      )
      output.print(`Job ${chalk.green(response.jobId)} started`)

      if (flags.detach) {
        return
      }

      followProgress(response.jobId, client, output)
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
