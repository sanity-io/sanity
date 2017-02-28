import path from 'path'
import got from 'got'
import fsp from 'fs-promise'
import prettyMs from 'pretty-ms'
import progrescii from 'progrescii'
import linecount from 'linecount/promise'
import debug from '../../debug'
import generateGuid from '../../util/generateGuid'
import strengthenReferences from '../../actions/dataset/import/strengthenReferences'
import importDocumentsToDataset from '../../actions/dataset/import/importDocumentsToDataset'

export default {
  name: 'import',
  group: 'dataset',
  signature: '[FILE] [TARGET_DATASET]',
  description: 'Import dataset from local filesystem',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context

    const gradientMode = args.extOptions.gradient
    const operation = getMutationOperation(args.extOptions)

    const [file, targetDataset] = args.argsWithoutOptions
    if (!file) {
      throw new Error(
        `Source file name and target dataset must be specified ("sanity dataset import ${chalk.bold('[file]')} [dataset]")`
      )
    }

    if (!targetDataset) {
      // @todo ask which dataset the user wants to use
      throw new Error(
        `Target dataset must be specified ("sanity dataset import [file] ${chalk.bold('[dataset]')}")`
      )
    }

    const isUrl = /^https?:\/\//i.test(file)
    const sourceFile = isUrl ? file : path.resolve(process.cwd(), file)
    const importId = generateGuid()
    const inputStream = isUrl ? got.stream(sourceFile) : fsp.createReadStream(sourceFile)

    const client = getSanityClient({
      gradient: gradientMode,
      token: args.extOptions.token,
      dataset: targetDataset,
      apiClient: apiClient
    })

    const documentCount = isUrl ? 0 : await linecount(sourceFile)
    debug(documentCount ? 'Could not count documents in source' : `Found ${documentCount} lines in source file`)
    debug(`Target dataset has been set to "${targetDataset}"`)

    let spinner = null

    // Verify existence of dataset before trying to import to it
    if (!gradientMode) {
      debug('Verifying if dataset already exists')
      spinner = output.spinner('Checking if destination dataset exists').start()
      const datasets = await client.datasets.list()
      if (!datasets.find(set => set.name === targetDataset)) {
        // @todo ask if user wants to create it
        spinner.fail()
        throw new Error([
          `Dataset with name "${targetDataset}" not found.`,
          `Create it by running "${chalk.cyan(`sanity dataset create ${targetDataset}`)}" first`
        ].join('\n'))
      }
      spinner.succeed()
    }

    // Import documents to the target dataset
    const importStartTime = Date.now()
    const batchSize = 150
    const lengthComputable = documentCount > 0
    const progressTotal = documentCount * 2 // @todo figure out how many reference maps we're gonna need and make a progress thing that makes sense
    const progress = lengthComputable ? progrescii.create({
      total: progressTotal,
      template: `${chalk.yellow('●')} Importing documents :b :p% in :ts`
    }) : output.spinner('Importing documents (0.00s)').start()
    const importState = {documentsCompleted: 0}

    // Update progress every 60ms
    const progressTicker = setInterval(() => {
      if (lengthComputable) {
        progress.render()
      } else {
        const docProgress = importState.documentsCompleted ? `- ${importState.documentsCompleted} imported` : ''
        progress.text = `Importing documents ${docProgress} (${prettyMs(Date.now() - importStartTime)})`
      }
    }, 60)

    try {
      await importDocumentsToDataset({
        inputStream,
        targetDataset,
        importId,
        operation,
        batchSize,
        client,
        progress: numDocs => {
          importState.documentsCompleted += numDocs

          if (!lengthComputable) {
            return
          }

          if (progress.progress + batchSize >= documentCount) {
            progress.template = `${chalk.green('✔')} Importing documents :b :p% in :ts`
            clearInterval(progressTicker)
          }

          progress.step(Math.min(batchSize, documentCount))
        }
      }, context)

      clearInterval(progressTicker)
      if (!lengthComputable) {
        progress.succeed()
      }
    } catch (err) {
      clearInterval(progressTicker)
      if (lengthComputable) {
        output.print('\n')
      } else {
        progress.fail()
      }
      return output.error(err)
    }

    // Make previously strong references strong once again
    let strengthenCount = 0
    const strengthenStart = Date.now()
    const baseStrengthenText = 'Strengthening weak references'
    spinner = output.spinner(baseStrengthenText).start()

    const strengthenProgress = docCount => {
      strengthenCount += docCount
      spinner.text = `${baseStrengthenText} (${strengthenCount} documents complete)`
    }

    try {
      await strengthenReferences({progress: strengthenProgress, client, importId})
      const strengthenTime = prettyMs(Date.now() - strengthenStart, {verbose: true})
      spinner.text = `${spinner.text} (${strengthenTime})`
      spinner.succeed()
    } catch (err) {
      spinner.fail()
      return output.error(err)
    }

    // That... should be it.
    const totalTime = prettyMs(Date.now() - importStartTime, {verbose: true})
    return output.print(`${chalk.green('All done!')} Spent ${totalTime}`)
  }
}

function getSanityClient(options) {
  if (!options.gradient) {
    return options.apiClient()
  }

  const existing = options.apiClient({requireUser: false})
  const config = existing.config()

  return existing.clone().config({
    gradientMode: true,
    apiHost: options.gradient,
    dataset: options.dataset || config.dataset,
    token: options.token || config.token,
  })
}

function getMutationOperation(flags) {
  const {replace, missing} = flags
  if (replace && missing) {
    throw new Error('Cannot use both --replace and --missing')
  }

  if (flags.replace) {
    return 'createOrReplace'
  }

  if (flags.missing) {
    return 'createIfNotExists'
  }

  return 'create'
}
