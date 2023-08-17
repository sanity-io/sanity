import path from 'path'
import fs from 'fs/promises'
import {createReadStream} from 'fs'
import type {CliCommandContext, CliCommandDefinition, CliOutputter} from '@sanity/cli'
import {getIt} from 'get-it'
import {promise} from 'get-it/middleware'
import sanityImport from '@sanity/import'
import padStart from 'lodash/padStart'
import prettyMs from 'pretty-ms'
import {chooseDatasetPrompt} from '../../actions/dataset/chooseDatasetPrompt'
import {validateDatasetName} from '../../actions/dataset/validateDatasetName'
import {debug} from '../../debug'

const yellow = (str: string) => `\u001b[33m${str}\u001b[39m`

const helpText = `
Options
  --missing On duplicate document IDs, skip importing document in question
  --replace On duplicate document IDs, replace existing document with imported document
  --allow-failing-assets Skip assets that cannot be fetched/uploaded
  --replace-assets Skip reuse of existing assets
  --skip-cross-dataset-references Skips references to other datasets

Rarely used options (should generally not be used)
  --allow-assets-in-different-dataset Allow asset documents to reference different project/dataset

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

interface ImportFlags {
  'allow-assets-in-different-dataset'?: boolean
  'allow-failing-assets'?: boolean
  'asset-concurrency'?: boolean
  'replace-assets'?: boolean
  'skip-cross-dataset-references'?: boolean
  replace?: boolean
  missing?: boolean
}

interface ParsedImportFlags {
  allowAssetsInDifferentDataset?: boolean
  allowFailingAssets?: boolean
  assetConcurrency?: boolean
  skipCrossDatasetReferences?: boolean
  replaceAssets?: boolean
  replace?: boolean
  missing?: boolean
}

interface ProgressEvent {
  step: string
  total?: number
  current?: number
}

interface ImportWarning {
  type?: string
  url?: string
}

function toBoolIfSet(flag: unknown): boolean | undefined {
  return typeof flag === 'undefined' ? undefined : Boolean(flag)
}

function parseFlags(rawFlags: ImportFlags): ParsedImportFlags {
  const allowAssetsInDifferentDataset = toBoolIfSet(rawFlags['allow-assets-in-different-dataset'])
  const allowFailingAssets = toBoolIfSet(rawFlags['allow-failing-assets'])
  const assetConcurrency = toBoolIfSet(rawFlags['asset-concurrency'])
  const replaceAssets = toBoolIfSet(rawFlags['replace-assets'])
  const skipCrossDatasetReferences = toBoolIfSet(rawFlags['skip-cross-dataset-references'])
  const replace = toBoolIfSet(rawFlags.replace)
  const missing = toBoolIfSet(rawFlags.missing)
  return {
    allowAssetsInDifferentDataset,
    allowFailingAssets,
    assetConcurrency,
    skipCrossDatasetReferences,
    replaceAssets,
    replace,
    missing,
  }
}

const importDatasetCommand: CliCommandDefinition = {
  name: 'import',
  group: 'dataset',
  signature: '[FILE | FOLDER | URL] [TARGET_DATASET]',
  description: 'Import documents to given dataset from ndjson file',
  helpText,
  // eslint-disable-next-line max-statements
  action: async (args, context) => {
    const {apiClient, output, chalk, fromInitCommand} = context
    const flags = parseFlags(args.extOptions)
    const {allowAssetsInDifferentDataset, allowFailingAssets, assetConcurrency, replaceAssets} =
      flags

    const operation = getMutationOperation(args.extOptions)
    const client = apiClient()

    const [file, target] = args.argsWithoutOptions
    if (!file) {
      throw new Error(
        `Source file name and target dataset must be specified ("sanity dataset import ${chalk.bold(
          '[file]',
        )} [dataset]")`,
      )
    }

    const targetDataset = await determineTargetDataset(target, context)
    debug(`Target dataset has been set to "${targetDataset}"`)

    const isUrl = /^https?:\/\//i.test(file)
    let inputStream
    let assetsBase
    let sourceIsFolder = false

    if (isUrl) {
      debug('Input is a URL, streaming from source URL')
      inputStream = await getUrlStream(file)
    } else {
      const sourceFile = path.resolve(process.cwd(), file)
      const fileStats = await fs.stat(sourceFile).catch(() => null)
      if (!fileStats) {
        throw new Error(`${sourceFile} does not exist or is not readable`)
      }

      sourceIsFolder = fileStats.isDirectory()
      if (sourceIsFolder) {
        inputStream = sourceFile
      } else {
        assetsBase = path.dirname(sourceFile)
        inputStream = await createReadStream(sourceFile)
      }
    }

    const importClient = client.clone().config({dataset: targetDataset})

    let currentStep: string | undefined
    let currentProgress: ReturnType<CliOutputter['spinner']> | undefined
    let stepStart: number | undefined
    let spinInterval: ReturnType<typeof setInterval> | null = null
    let percent: string | undefined

    function onProgress(opts: ProgressEvent) {
      const lengthComputable = opts.total
      const sameStep = opts.step == currentStep
      percent = getPercentage(opts)

      if (lengthComputable && opts.total === opts.current) {
        if (spinInterval) {
          clearInterval(spinInterval)
        }
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
          secondsDecimalDigits: 2,
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
          secondsDecimalDigits: 2,
        })

        if (currentProgress) {
          currentProgress.text = `${percent}${opts.step} (${timeSpent})`
        }
      }, 60)
    }

    function endTask({success}: {success: boolean}) {
      if (spinInterval) {
        clearInterval(spinInterval)
      }

      spinInterval = null

      if (success && stepStart && currentProgress) {
        const timeSpent = prettyMs(Date.now() - stepStart, {
          secondsDecimalDigits: 2,
        })
        currentProgress.text = `[100%] ${currentStep} (${timeSpent})`
        currentProgress.succeed()
      } else if (currentProgress) {
        currentProgress.fail()
      }
    }

    // Start the import!
    try {
      const {numDocs, warnings} = await sanityImport(inputStream, {
        client: importClient,
        assetsBase,
        operation,
        onProgress,
        allowFailingAssets,
        allowAssetsInDifferentDataset,
        assetConcurrency,
        replaceAssets,
      })

      endTask({success: true})

      output.print('Done! Imported %d documents to dataset "%s"\n', numDocs, targetDataset)
      printWarnings(warnings, output)
    } catch (err) {
      endTask({success: false})

      const isNonRefConflict =
        !fromInitCommand &&
        err.response &&
        err.response.statusCode === 409 &&
        err.step !== 'strengthen-references'

      if (!isNonRefConflict) {
        throw err
      }

      const message = [
        err.message,
        '',
        'You probably want either:',
        ' --replace (replace existing documents with same IDs)',
        ' --missing (only import documents that do not already exist)',
        '',
      ].join('\n')

      // @todo SUBCLASS ERROR?
      const error = new Error(message) as any
      error.details = err.details
      error.response = err.response
      error.responseBody = err.responseBody

      throw error
    }
  },
}

async function determineTargetDataset(target: string, context: CliCommandContext) {
  const {apiClient, output, prompt} = context
  const client = apiClient()

  if (target) {
    const dsError = validateDatasetName(target)
    if (dsError) {
      throw new Error(dsError)
    }
  }

  debug('Fetching available datasets')
  const spinner = output.spinner('Fetching available datasets').start()
  const datasets = await client.datasets.list()
  spinner.succeed('[100%] Fetching available datasets')

  let targetDataset = target ? `${target}` : null
  if (!targetDataset) {
    targetDataset = await chooseDatasetPrompt(context, {
      message: 'Select target dataset',
      allowCreation: true,
    })
  } else if (!datasets.find((dataset) => dataset.name === targetDataset)) {
    debug('Target dataset does not exist, prompting for creation')
    const shouldCreate = await prompt.single({
      type: 'confirm',
      message: `Dataset "${targetDataset}" does not exist, would you like to create it?`,
      default: true,
    })

    if (!shouldCreate) {
      throw new Error(`Dataset "${targetDataset}" does not exist`)
    }

    await client.datasets.create(targetDataset)
  }

  return targetDataset
}

function getMutationOperation(flags: ParsedImportFlags) {
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

function getPercentage(opts: ProgressEvent) {
  if (!opts.total || typeof opts.current === 'undefined') {
    return ''
  }

  const percent = Math.floor((opts.current / opts.total) * 100)
  return `[${padStart(`${percent}`, 3, ' ')}%] `
}

function getUrlStream(url: string) {
  const request = getIt([promise({onlyBody: true})])
  return request({url, stream: true})
}

function printWarnings(warnings: ImportWarning[], output: CliOutputter) {
  const assetFails = warnings.filter((warn) => warn.type === 'asset')

  if (!assetFails.length) {
    return
  }

  const warn = (output.warn || output.print).bind(output)

  warn(yellow('⚠ Failed to import the following %s:'), assetFails.length > 1 ? 'assets' : 'asset')

  warnings.forEach((warning) => {
    warn(`  ${warning.url}`)
  })
}

export default importDatasetCommand
