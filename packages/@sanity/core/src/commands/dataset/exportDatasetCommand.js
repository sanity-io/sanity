import path from 'path'
import fse from 'fs-extra'
import split from 'split2'
import prettyMs from 'pretty-ms'
import {pathTools} from '@sanity/util'
import streamDataset from '../../actions/dataset/streamDataset'
import skipSystemDocuments from '../../util/skipSystemDocuments'
import chooseDatasetPrompt from '../../actions/dataset/chooseDatasetPrompt'

export default {
  name: 'export',
  group: 'dataset',
  signature: '[NAME] [DESTINATION]',
  description: 'Export dataset to local filesystem',
  action: async (args, context) => {
    const {apiClient, output, chalk, workDir, prompt} = context
    const client = apiClient()
    const [targetDataset, targetDestination] = args.argsWithoutOptions
    const {absolutify} = pathTools

    let dataset = targetDataset
    if (!dataset) {
      dataset = await chooseDatasetPrompt(context, {message: 'Select dataset to export'})
    }

    // Verify existence of dataset before trying to export from it
    const datasets = await client.datasets.list()
    if (!datasets.find(set => set.name === dataset)) {
      throw new Error(
        `Dataset with name "${dataset}" not found`
      )
    }

    let destinationPath = targetDestination
    if (!destinationPath) {
      destinationPath = await prompt.single({
        type: 'input',
        message: 'Output path:',
        default: path.join(workDir, `${dataset}.ndjson`),
        filter: absolutify
      })
    }

    const outputPath = await getOutputPath(destinationPath, dataset)

    // If we are dumping to a file, let the user know where it's at
    if (outputPath) {
      output.print(`Exporting dataset "${chalk.cyan(dataset)}" to "${chalk.cyan(outputPath)}"`)
    }

    const startTime = Date.now()

    const stream = await streamDataset(client, dataset)
    stream
      .pipe(split())
      .pipe(skipSystemDocuments)
      .pipe(outputPath ? fse.createWriteStream(outputPath) : process.stdout)
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
    dstStats = await fse.stat(dstPath)
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

    await fse.mkdirs(createPath)
  }

  return looksLikeFile
    ? dstPath
    : path.join(dstPath, `${dataset}.ndjson`)
}
