import path from 'path'
import fsp from 'fs-promise'
import prettyMs from 'pretty-ms'
import streamDataset from '../../actions/dataset/streamDataset'

export default {
  name: 'export',
  group: 'dataset',
  signature: '[NAME] [DESTINATION]',
  description: 'Export dataset to local filesystem',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const client = apiClient()
    const [dataset, destination] = args.argsWithoutOptions
    const signature = 'sanity dataset export [dataset] [destination]'

    if (!dataset) {
      throw new Error(
        `Dataset must be specified ("${signature}")`
      )
    }

    if (!destination) {
      throw new Error(
        `Destination filename must be specified. Use "-" to print to stdout. ("${signature}")`
      )
    }

    // Verify existence of dataset before trying to export from it
    const datasets = await client.datasets.list()
    if (!datasets.find(set => set.name === dataset)) {
      throw new Error(
        `Dataset with name "${dataset}" not found`
      )
    }

    const outputPath = await getOutputPath(destination, dataset)

    // If we are dumping to a file, let the user know where it's at
    if (outputPath) {
      output.print(`Exporting dataset "${chalk.cyan(dataset)}" to "${chalk.cyan(outputPath)}"`)
    }

    const startTime = Date.now()

    streamDataset(client, dataset)
      .pipe(outputPath ? fsp.createWriteStream(outputPath) : process.stdout)
      .on('error', err => output.error(err))
      .on('close', () => {
        if (outputPath) {
          const time = prettyMs(Date.now() - startTime, {verbose: true})
          output.print(`Done. Time spent: ${chalk.cyan(time)}`)
        }
      })
  }
}

async function getOutputPath(destination, dataset) {
  if (destination === '-') {
    return null
  }

  const dstPath = path.isAbsolute(destination)
    ? destination
    : path.resolve(process.cwd(), destination)

  let dstStats = null
  try {
    dstStats = await fsp.stat(dstPath)
  } catch (err) {
    // Do nothing
  }

  const looksLikeFile = dstStats
    ? dstStats.isFile()
    : path.basename(dstPath).indexOf('.') !== -1

  if (!dstStats) {
    const createPath = looksLikeFile
      ? path.dirname(dstPath)
      : dstPath

    await fsp.mkdirs(createPath)
  }

  return looksLikeFile
    ? dstPath
    : path.join(dstPath, `${dataset}.ndjson`)
}
