import EventSource from 'eventsource'
import Observable from '@sanity/observable/minimal'
import chalk from 'chalk'
import promptForDatasetName from '../../actions/dataset/datasetNamePrompt'
import validateDatasetName from '../../actions/dataset/validateDatasetName'
import debug from '../../debug'

const helpText = `
Options
  --wait Waits for the operation to finish

Examples
  sanity dataset copy
  sanity dataset copy <source-dataset>
  sanity dataset copy <source-dataset> <target-dataset>
`

const progress = (url) => {
  return new Observable((observer) => {
    const progressSource = new EventSource(url)

    function onError(error) {
      progressSource.close()
      observer.error(error)
    }

    function onMessage(event) {
      const data = JSON.parse(event.data)
      if (data.state === 'failed') {
        debug(`Job failed. Data: ${event}`)
        observer.error(event)
      } else if (data.state === 'completed') {
        debug(`Job succeeded. Data: ${event}`)
        onComplete()
      } else {
        debug(`Job progressed. Data: ${event}`)
        observer.next(data)
      }
    }

    function onComplete() {
      progressSource.removeEventListener('error', onError)
      progressSource.removeEventListener('channelError', onError)
      progressSource.removeEventListener('job', onMessage)
      progressSource.removeEventListener('done', onComplete)
      progressSource.close()
      observer.complete()
    }

    progressSource.addEventListener('error', onError)
    progressSource.addEventListener('channelError', onError)
    progressSource.addEventListener('job', onMessage)
    progressSource.addEventListener('done', onComplete)
  })
}

export default {
  name: 'copy',
  group: 'dataset',
  signature: '[SOURCE_DATASET] [TARGET_DATASET]',
  helpText,
  description: 'Copies a dataset including its assets to a new dataset',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [sourceDataset, targetDataset] = args.argsWithoutOptions
    const flags = args.extOptions
    const client = apiClient()

    const nameError = sourceDataset && validateDatasetName(sourceDataset)
    if (nameError) {
      throw new Error(nameError)
    }

    const existingDatasets = await client.datasets
      .list()
      .then((datasets) => datasets.map((ds) => ds.name))

    const sourceDatasetName = await (sourceDataset || promptForDatasetName(prompt))
    if (!existingDatasets.includes(sourceDatasetName)) {
      throw new Error(`Dataset "${sourceDatasetName}" doesn't exist`)
    }

    const targetDatasetName = await (targetDataset || promptForDatasetName(prompt))
    if (existingDatasets.includes(targetDatasetName)) {
      throw new Error(`Dataset "${targetDatasetName}" already exists`)
    }

    const err = validateDatasetName(targetDatasetName)
    if (err) {
      throw new Error(err)
    }

    try {
      const response = await client.request({
        method: 'PUT',
        uri: `/datasets/${sourceDatasetName}/copy`,
        body: {targetDataset: targetDatasetName},
      })

      output.print(
        `Copying dataset ${chalk.green(sourceDatasetName)} to ${chalk.green(targetDatasetName)}...`
      )

      if (!flags.wait) {
        return
      }

      const spinner = output
        .spinner({
          text: `~0% done.`,
        })
        .start()

      const listenUrl = client.getUrl(`jobs/${response.jobId}/listen`)
      debug(`Listening on ${listenUrl}`)
      progress(listenUrl).subscribe({
        next: (event) => {
          spinner.text = `~${event.progress}% done.`
        },
        error: () => {
          spinner.fail('There was an error copying the dataset.')
        },
        complete: () => {
          spinner.succeed(
            `Finished copying dataset ${chalk.green(sourceDatasetName)} to ${chalk.green(
              targetDatasetName
            )}.`
          )
        },
      })
    } catch (error) {
      if (error.statusCode) {
        output.print(`${chalk.red(`Dataset copying failed:\n${error.response.body.message}`)}\n`)
      } else {
        output.print(`${chalk.red(`Dataset copying failed:\n${error.message}`)}\n`)
      }
    }
  },
}
