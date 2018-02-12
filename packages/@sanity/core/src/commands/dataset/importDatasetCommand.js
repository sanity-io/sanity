import path from 'path'
import simpleGet from 'simple-get'
import fse from 'fs-extra'
import sanityImport from '@sanity/import'
import padStart from 'lodash/padStart'
import prettyMs from 'pretty-ms'
import linecount from 'linecount/promise'
import chooseDatasetPrompt from '../../actions/dataset/chooseDatasetPrompt'
import debug from '../../debug'

const helpText = `
Options
  --missing On duplicate document IDs, skip importing document in question
  --replace On duplicate document IDs, replace existing document with imported document

Examples
  sanity import moviedb.ndjson moviedb
  sanity import moviedb.ndjson moviedb --replace
`

export default {
  name: 'import',
  group: 'dataset',
  signature: '[FILE] [TARGET_DATASET]',
  description: 'Import documents to given dataset from ndjson file',
  helpText,
  action: async (args, context) => {
    const {apiClient, output, chalk} = context

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
    const sourceFile = isUrl ? file : path.resolve(process.cwd(), file)
    const inputSource = isUrl ? getUrlStream(sourceFile) : fse.createReadStream(sourceFile)
    const inputStream = await inputSource

    const documentCount = isUrl ? 0 : await linecount(sourceFile)
    debug(
      documentCount
        ? 'Could not count documents in source'
        : `Found ${documentCount} lines in source file`
    )

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
      } else {
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
      if (err.response && err.response.statusCode === 409) {
        error = [
          err.message,
          '',
          'You probably want either:',
          ' --replace (replace existing documents with same IDs)',
          ' --missing (only import documents that do not already exist)'
        ].join('\n')
      }

      output.error(chalk.red(`\n${error}\n`))
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

  const percent = Math.floor(opts.current / opts.total * 100)
  return `[${padStart(percent, 3, ' ')}%] `
}

function getUrlStream(url) {
  return new Promise((resolve, reject) => {
    simpleGet(url, (err, res) => (err ? reject(err) : resolve(res)))
  })
}
