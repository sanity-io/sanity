import path from 'path'
import prettyMs from 'pretty-ms'
import debug from '../../debug'
import generateGuid from '../../util/generateGuid'
import readFirstLine from '../../util/readFirstLine'
import strengthenReferences from '../../actions/dataset/strengthenReferences'
import importDocumentsToDataset from '../../actions/dataset/importDocumentsToDataset'

export default {
  name: 'import',
  group: 'dataset',
  signature: '[FILE] [TARGET_DATASET]',
  description: 'Import dataset from local filesystem',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const client = apiClient()
    const [file, specifiedDataset] = args.argsWithoutOptions
    const signature = 'sanity dataset import [file] [dataset]'
    if (!file) {
      throw new Error(
        `File name must be specified ("${signature}")`
      )
    }

    const importStartTime = Date.now()
    const sourceFile = path.resolve(process.cwd(), file)
    const importId = generateGuid()
    let targetDataset = specifiedDataset
    let fromDataset = specifiedDataset
    let rewriteDataset = false
    try {
      const firstLine = await readFirstLine(sourceFile)
      const firstDocId = JSON.parse(firstLine)._id
      fromDataset = firstDocId.split('/', 2)[0]
      rewriteDataset = specifiedDataset && fromDataset !== specifiedDataset
      targetDataset = specifiedDataset ? specifiedDataset : fromDataset
    } catch (err) {
      throw new Error(err.code === 'ENOENT'
        ? `File "${chalk.cyan(sourceFile)}" does not exist`
        : `Failed to parse specified file ("${chalk.cyan(sourceFile)}")`
      )
    }

    debug(`Target dataset has been resolved to "${targetDataset}"`)
    debug(`IDs ${rewriteDataset ? 'needs' : 'do not need'} to be rewritten`)

    // Verify existence of dataset before trying to import to it
    debug('Verifying if dataset already exists')
    let spinner = output.spinner('Checking if destination dataset exists').start()
    const datasets = await client.datasets.list()
    if (!datasets.find(set => set.name === targetDataset)) {
      spinner.fail()
      throw new Error([
        `Dataset with name "${targetDataset}" not found.`,
        `Create it by running "${chalk.cyan(`sanity dataset create ${targetDataset}`)}" first`
      ].join('\n'))
    }
    spinner.succeed()

    // Import documents to the target dataset
    spinner = output.spinner('Importing documents to dataset').start()
    try {
      const importResult = await importDocumentsToDataset({
        sourceFile,
        targetDataset,
        fromDataset,
        importId
      }, context)

      const time = prettyMs(importResult.timeSpent, {verbose: true})
      spinner.text = `${spinner.text} (${time})`
      spinner.succeed()
    } catch (err) {
      spinner.fail()
      return output.error(err)
    }

    // Make previously strong references strong once again
    const strengthenStart = Date.now()
    spinner = output.spinner('Strengthening weak references').start()
    try {
      await strengthenReferences(context, {dataset: targetDataset, importId})
      const strengthenTime = prettyMs(Date.now() - strengthenStart, {verbose: true})
      spinner.text = `${spinner.text} (${strengthenTime})`
      spinner.succeed()
    } catch (err) {
      spinner.fail()
      return output.error(err)
    }

    // That... should be it.
    const totalTime = prettyMs(Date.now() - importStartTime, {verbose: true})
    output.print(`${chalk.green('All done!')} Spent ${totalTime}`)
  }
}
