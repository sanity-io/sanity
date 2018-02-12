import path from 'path'
import fse from 'fs-extra'
import {pathTools} from '@sanity/util'
import exportDataset from '@sanity/export'
import chooseDatasetPrompt from '../../actions/dataset/chooseDatasetPrompt'

const noop = () => null

export default {
  name: 'export',
  group: 'dataset',
  signature: '[NAME] [DESTINATION]',
  description: 'Export dataset to local filesystem',
  action: async (args, context) => {
    const {apiClient, output, chalk, workDir, prompt} = context
    const client = apiClient()
    const [targetDataset, targetDestination] = args.argsWithoutOptions
    const flags = args.extOptions
    const {absolutify} = pathTools

    let dataset = targetDataset ? `${targetDataset}` : null
    if (!dataset) {
      dataset = await chooseDatasetPrompt(context, {message: 'Select dataset to export'})
    }

    // Verify existence of dataset before trying to export from it
    const datasets = await client.datasets.list()
    if (!datasets.find(set => set.name === dataset)) {
      throw new Error(`Dataset with name "${dataset}" not found`)
    }

    let destinationPath = targetDestination
    if (!destinationPath) {
      destinationPath = await prompt.single({
        type: 'input',
        message: 'Output path:',
        default: path.join(workDir, `${dataset}.tar.gz`),
        filter: absolutify
      })
    }

    const outputPath = await getOutputPath(destinationPath, dataset, prompt, flags)
    if (!outputPath) {
      output.print('Cancelled')
      return
    }

    // If we are dumping to a file, let the user know where it's at
    if (outputPath !== '-') {
      output.print(`Exporting dataset "${chalk.cyan(dataset)}" to "${chalk.cyan(outputPath)}"`)
    }

    let currentStep = 'Exporting documents...'
    let spinner = output.spinner(currentStep).start()
    const onProgress = progress => {
      if (progress.step !== currentStep) {
        spinner.succeed()
        spinner = output.spinner(progress.step).start()
      } else if (progress.step === currentStep && progress.update) {
        spinner.text = `${progress.step} (${progress.current}/${progress.total})`
      }

      currentStep = progress.step
    }

    try {
      await exportDataset({
        client,
        dataset,
        outputPath,
        onProgress,
        ...flags
      })
      spinner.succeed()
    } catch (err) {
      spinner.fail()
      throw err
    }
  }
}

// eslint-disable-next-line complexity
async function getOutputPath(destination, dataset, prompt, flags) {
  if (destination === '-') {
    return '-'
  }

  const dstPath = path.isAbsolute(destination)
    ? destination
    : path.resolve(process.cwd(), destination)

  let dstStats = await fse.stat(dstPath).catch(noop)
  const looksLikeFile = dstStats ? dstStats.isFile() : path.basename(dstPath).indexOf('.') !== -1

  if (!dstStats) {
    const createPath = looksLikeFile ? path.dirname(dstPath) : dstPath

    await fse.mkdirs(createPath)
  }

  const finalPath = looksLikeFile ? dstPath : path.join(dstPath, `${dataset}.tar.gz`)
  dstStats = await fse.stat(finalPath).catch(noop)

  if (!flags.overwrite && dstStats && dstStats.isFile()) {
    const shouldOverwrite = await prompt.single({
      type: 'confirm',
      message: `File "${finalPath}" already exists, would you like to overwrite it?`,
      default: false
    })

    if (!shouldOverwrite) {
      return false
    }
  }

  return finalPath
}
