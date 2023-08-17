#!/usr/bin/env node

/* eslint-disable id-length, no-console, no-process-env */
const fs = require('fs')
const path = require('path')
const ora = require('ora')
const {getIt} = require('get-it')
const {promise} = require('get-it/middleware')
const meow = require('meow')
const prettyMs = require('pretty-ms')
const {createClient} = require('@sanity/client')
const sanityImport = require('@sanity/import')

const red = (str) => `\u001b[31m${str}\u001b[39m`
const yellow = (str) => `\u001b[33m${str}\u001b[39m`
const printError = (str) => console.error(red(`ERROR: ${str}`))

const cli = meow(
  `
  Usage
    $ sanity-import -p <projectId> -d <dataset> -t <token> sourceFile.ndjson

  Options
    -p, --project <projectId> Project ID to import to
    -d, --dataset <dataset> Dataset to import to
    -t, --token <token> Token to authenticate with
    --asset-concurrency <concurrency> Number of parallel asset imports
    --replace Replace documents with the same IDs
    --missing Skip documents that already exist
    --allow-failing-assets Skip assets that cannot be fetched/uploaded
    --replace-assets Skip reuse of existing assets
    --skip-cross-dataset-references Skips references to other datasets
    --help Show this help

  Rarely used options (should generally not be used)
    --allow-assets-in-different-dataset Allow asset documents to reference different project/dataset

  Examples
    # Import "./my-dataset.ndjson" into dataset "staging"
    $ sanity-import -p myPrOj -d staging -t someSecretToken my-dataset.ndjson

    # Import into dataset "test" from stdin, read token from env var
    $ cat my-dataset.ndjson | sanity-import -p myPrOj -d test -

  Environment variables (fallbacks for missing flags)
    --token = SANITY_IMPORT_TOKEN
`,
  {
    flags: {
      // Required, but validated below for better error output
      project: {
        type: 'string',
        alias: 'p',
      },

      dataset: {
        type: 'string',
        alias: 'd',
      },

      token: {
        type: 'string',
        alias: 't',
      },

      // Optional
      replace: {
        type: 'boolean',
        default: false,
      },

      missing: {
        type: 'boolean',
        default: false,
      },

      allowFailingAssets: {
        type: 'boolean',
        default: false,
      },

      allowAssetsInDifferentDataset: {
        type: 'boolean',
        default: false,
      },

      replaceAssets: {
        type: 'boolean',
        default: false,
      },

      skipCrossDatasetReferences: {
        type: 'boolean',
        default: false,
      },

      assetConcurrency: {
        type: 'number',
        alias: 'c',
      },
    },
  },
)

const {flags, input, showHelp} = cli
const {
  dataset,
  allowFailingAssets,
  replaceAssets,
  allowAssetsInDifferentDataset,
  skipCrossDatasetReferences,
} = flags
const token = flags.token || process.env.SANITY_IMPORT_TOKEN
const projectId = flags.project
const assetConcurrency = flags.assetConcurrency
const source = input[0]

if (!projectId) {
  printError('Flag `--project` is required')
  showHelp()
}

if (!dataset) {
  printError('Flag `--dataset` is required')
  showHelp()
}

if (!token) {
  printError('Flag `--token` is required (or set SANITY_IMPORT_TOKEN)')
  showHelp()
}

if (!source) {
  printError('Source file is required, use `-` to read from stdin')
  showHelp()
}

let operation = 'create'
if (flags.replace || flags.missing) {
  if (flags.replace && flags.missing) {
    printError('Cannot use both `--replace` and `--missing`')
    showHelp()
  }

  operation = flags.replace ? 'createOrReplace' : 'createIfNotExists'
}

let currentStep
let currentProgress
let stepStart
let spinInterval

const client = createClient({
  apiVersion: '1',
  projectId,
  dataset,
  token,
  useCdn: false,
})

getStream()
  .then((stream) =>
    sanityImport(stream, {
      client,
      operation,
      onProgress,
      allowFailingAssets,
      allowAssetsInDifferentDataset,
      skipCrossDatasetReferences,
      assetConcurrency,
      replaceAssets,
      assetsBase: getAssetsBase(),
    }),
  )
  .then(({numDocs, warnings}) => {
    const timeSpent = prettyMs(Date.now() - stepStart, {secondsDecimalDigits: 2})
    currentProgress.text = `[100%] ${currentStep} (${timeSpent})`
    currentProgress.succeed()

    console.log('Done! Imported %d documents to dataset "%s"\n', numDocs, dataset)
    printWarnings(warnings)
  })
  .catch((err) => {
    if (currentProgress) {
      currentProgress.fail()
    }

    printError(err.stack)
  })

function printWarnings(warnings) {
  const assetFails = warnings.filter((warn) => warn.type === 'asset')

  if (!assetFails.length) {
    return
  }

  console.warn(
    yellow('⚠ Failed to import the following %s:'),
    assetFails.length > 1 ? 'assets' : 'asset',
  )

  warnings.forEach((warning) => {
    console.warn(`  ${warning.url}`)
  })
}

function getStream() {
  if (/^https:\/\//i.test(source)) {
    return getUriStream(source)
  }

  return Promise.resolve(source === '-' ? process.stdin : fs.createReadStream(source))
}

function getAssetsBase() {
  if (/^https:\/\//i.test(source) || source === '-') {
    return undefined
  }

  try {
    const fileStats = fs.statSync(source)
    const sourceIsFolder = fileStats.isDirectory()
    return sourceIsFolder ? source : path.dirname(source)
  } catch {
    return undefined
  }
}

function getUriStream(uri) {
  const get = getIt([promise()])
  return get({url: uri, stream: true}).then(
    (res) => {
      if (res.statusCode !== 200) {
        throw new Error(`Error fetching source: HTTP ${res.statusCode}`)
      }

      return res.body
    },
    (err) => {
      throw new Error(`Error fetching source:\n${err.message}`)
    },
  )
}

function onProgress(opts) {
  const lengthComputable = opts.total
  const sameStep = opts.step == currentStep
  const percent = getPercentage(opts)

  if (lengthComputable && opts.total === opts.current) {
    clearInterval(spinInterval)
    spinInterval = null
  }

  if (sameStep && !lengthComputable) {
    return
  }

  if (sameStep) {
    const timeSpent = prettyMs(Date.now() - stepStart, {secDecimalDigits: 2})
    currentProgress.text = `${percent}${opts.step} (${timeSpent})`
    currentProgress.render()
    return
  }

  // Moved to a new step
  const prevStep = currentStep
  const prevStepStart = stepStart
  stepStart = Date.now()
  currentStep = opts.step

  if (spinInterval) {
    clearInterval(spinInterval)
    spinInterval = null
  }

  if (currentProgress && currentProgress.succeed) {
    const timeSpent = prettyMs(Date.now() - prevStepStart, {
      secDecimalDigits: 2,
    })
    currentProgress.text = `[100%] ${prevStep} (${timeSpent})`
    currentProgress.succeed()
  }

  currentProgress = ora(`[0%] ${opts.step} (0.00s)`).start()

  if (!lengthComputable) {
    spinInterval = setInterval(() => {
      const timeSpent = prettyMs(Date.now() - prevStepStart, {
        secDecimalDigits: 2,
      })
      currentProgress.text = `${percent}${opts.step} (${timeSpent})`
      currentProgress.render()
    }, 60)
  }
}

function getPercentage(opts) {
  if (!opts.total) {
    return ''
  }

  const percent = Math.floor((opts.current / opts.total) * 100)
  return `[${percent}%] `
}
