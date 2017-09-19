import path from 'path'
import got from 'got'
import padStart from 'lodash/padStart'
import fsp from 'fs-promise'
import prettyMs from 'pretty-ms'
import linecount from 'linecount/promise'
import debug from '../../debug'
import sanityImport from '@sanity/import'

export default {
  name: 'import',
  group: 'dataset',
  signature: '[FILE] [TARGET_DATASET]',
  description: 'Import dataset from local filesystem',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context

    const operation = getMutationOperation(args.extOptions)

    const [file, targetDataset] = args.argsWithoutOptions
    if (!file) {
      throw new Error(
        `Source file name and target dataset must be specified ("sanity dataset import ${chalk.bold(
          '[file]'
        )} [dataset]")`
      )
    }

    if (!targetDataset) {
      // @todo ask which dataset the user wants to use
      throw new Error(
        `Target dataset must be specified ("sanity dataset import [file] ${chalk.bold(
          '[dataset]'
        )}")`
      )
    }

    const isUrl = /^https?:\/\//i.test(file)
    const sourceFile = isUrl ? file : path.resolve(process.cwd(), file)
    const inputStream = isUrl
      ? got.stream(sourceFile)
      : fsp.createReadStream(sourceFile)
    const client = apiClient()

    const documentCount = isUrl ? 0 : await linecount(sourceFile)
    debug(
      documentCount
        ? 'Could not count documents in source'
        : `Found ${documentCount} lines in source file`
    )
    debug(`Target dataset has been set to "${targetDataset}"`)

    let spinner = null

    // Verify existence of dataset before trying to import to it
    debug('Verifying if dataset already exists')
    spinner = output.spinner('Checking if destination dataset exists').start()
    const datasets = await client.datasets.list()
    if (!datasets.find(set => set.name === targetDataset)) {
      // @todo ask if user wants to create it
      spinner.fail()
      throw new Error(
        [
          `Dataset with name "${targetDataset}" not found.`,
          `Create it by running "${chalk.cyan(
            `sanity dataset create ${targetDataset}`
          )}" first`
        ].join('\n')
      )
    }
    spinner.succeed()

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

      output.print(
        'Done! Imported %d documents to dataset "%s"',
        imported,
        targetDataset
      )
    } catch (err) {
      endTask({success: false})
      output.error(err)
    }
  }
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
