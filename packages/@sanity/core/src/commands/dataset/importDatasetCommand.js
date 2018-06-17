import path from 'path'
import simpleGet from 'simple-get'
import fse from 'fs-extra'
import sanityImport from '@sanity/import'
import padStart from 'lodash/padStart'
import prettyMs from 'pretty-ms'
import chooseDatasetPrompt from '../../actions/dataset/chooseDatasetPrompt'
import debug from '../../debug'

const helpText = `
Options
  --missing On duplicate document IDs, skip importing document in question
  --replace On duplicate document IDs, replace existing document with imported document

Examples
  # Import "moviedb.ndjson" from the current directory to the dataset called "moviedb"
  sanity dataset import moviedb.ndjson moviedb

  # Import "moviedb.tar.gz" from the current directory to the dataset called "moviedb",
  # replacing any documents encountered that have the same document IDs
  sanity dataset import moviedb.tar.gz moviedb --replace

  # Import from a folder containing an ndjson file, such as an extracted tarball
  # retrieved through "sanity dataset export".
  sanity dataset import ~/some/folder moviedb

  # Import from a remote URL. Will download and extract the tarball to a temporary
  # location before importing it.
  sanity dataset import https://some.url/moviedb.tar.gz moviedb --replace
`

export default {
  name: 'import',
  group: 'dataset',
  signature: '[FILE | FOLDER | URL] [TARGET_DATASET]',
  description: 'Import documents to given dataset from ndjson file',
  helpText,
  action: async (args, context) => {
    const {apiClient, output, chalk, fromInitCommand} = context

    const operation = getMutationOperation(args.extOptions)
    const client = apiClient()

    const [file, target] = args.argsWithoutOptions
    if (!file) {
      throw new Error(
        `Source file name and target dataset must be specified ("sanity dataset import ${chalk.bold(
          '[file]'
        )} [dataset]")`
      )
    }

    const targetDataset = await determineTargetDataset(target, context)
    debug(`Target dataset has been set to "${targetDataset}"`)

    const isUrl = /^https?:\/\//i.test(file)
    let inputStream
    let sourceIsFolder = false

    if (isUrl) {
      debug('Input is a URL, streaming from source URL')
      inputStream = await getUrlStream(file)
    } else {
      const sourceFile = path.resolve(process.cwd(), file)
      const fileStats = await fse.stat(sourceFile).catch(() => null)
      if (!fileStats) {
        throw new Error(`${sourceFile} does not exist or is not readable`)
      }

      sourceIsFolder = fileStats.isDirectory()
      inputStream = sourceIsFolder ? sourceFile : await fse.createReadStream(sourceFile)
    }

    const importClient = client.clone().config({dataset: targetDataset})

    let currentStep
    let currentProgress
    let stepStart
    let spinInterval
    let percent

    function onProgress(opts) {
      const lengthComputable = opts.total
      const sameStep = opts.step == currentStep
      percent = getPercentage(opts)

      if (lengthComputable && opts.total === opts.current) {
        clearInterval(spinInterval)
        spinInterval = null
      }

      if (sameStep) {
        return
      }

      // Moved to a new step
      const prevStep = currentStep
      const prevStepStart = stepStart || Date.now()
      stepStart = Date.now()
      currentStep = opts.step

      if (currentProgress && currentProgress.succeed) {
        const timeSpent = prettyMs(Date.now() - prevStepStart, {
          secDecimalDigits: 2
        })
        currentProgress.text = `[100%] ${prevStep} (${timeSpent})`
        currentProgress.succeed()
      }

      currentProgress = output.spinner(`[0%] ${opts.step} (0.00s)`).start()

      if (spinInterval) {
        clearInterval(spinInterval)
        spinInterval = null
      }

      spinInterval = setInterval(() => {
        const timeSpent = prettyMs(Date.now() - prevStepStart, {
          secDecimalDigits: 2
        })
        currentProgress.text = `${percent}${opts.step} (${timeSpent})`
      }, 60)
    }

    function endTask({success}) {
      clearInterval(spinInterval)
      spinInterval = null

      if (success) {
        const timeSpent = prettyMs(Date.now() - stepStart, {
          secDecimalDigits: 2
        })
        currentProgress.text = `[100%] ${currentStep} (${timeSpent})`
        currentProgress.succeed()
      } else if (currentProgress) {
        currentProgress.fail()
      }
    }

    // Start the import!
    try {
      const imported = await sanityImport(inputStream, {
        client: importClient,
        operation,
        onProgress
      })

      endTask({success: true})

      output.print('Done! Imported %d documents to dataset "%s"', imported, targetDataset)
    } catch (err) {
      endTask({success: false})

      let error = err.message
      if (!fromInitCommand && err.response && err.response.statusCode === 409) {
        error = [
          err.message,
          '',
          'You probably want either:',
          ' --replace (replace existing documents with same IDs)',
          ' --missing (only import documents that do not already exist)'
        ].join('\n')

        err.message = error
      }

      throw err
    }
  }
}

async function determineTargetDataset(target, context) {
  const {apiClient, output, prompt} = context
  const client = apiClient()

  debug('[  0%] Fetching available datasets')
  const spinner = output.spinner('Fetching available datasets').start()
  const datasets = await client.datasets.list()
  spinner.succeed('[100%] Fetching available datasets')

  let targetDataset = target ? `${target}` : null
  if (!targetDataset) {
    targetDataset = await chooseDatasetPrompt(context, {
      message: 'Select target dataset',
      allowCreation: true
    })
  } else if (!datasets.find(dataset => dataset.name === targetDataset)) {
    debug('Target dataset does not exist, prompting for creation')
    const shouldCreate = await prompt.single({
      type: 'confirm',
      message: `Dataset "${targetDataset}" does not exist, would you like to create it?`,
      default: true
    })

    if (!shouldCreate) {
      throw new Error(`Dataset "${targetDataset}" does not exist`)
    }

    await client.datasets.create(targetDataset)
  }

  return targetDataset
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

function getPercentage(opts) {
  if (!opts.total) {
    return ''
  }

  const percent = Math.floor((opts.current / opts.total) * 100)
  return `[${padStart(percent, 3, ' ')}%] `
}

function getUrlStream(url) {
  return new Promise((resolve, reject) => {
    simpleGet(url, (err, res) => (err ? reject(err) : resolve(res)))
  })
}
