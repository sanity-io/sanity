#!/usr/bin/env node

/* eslint-disable id-length, no-console, no-process-env, no-sync */
const fs = require('fs')
const meow = require('meow')
const sanityClient = require('@sanity/client')
const sanityImport = require('../import')

const red = str => `\u001b[31mERROR: ${str}\u001b[39m`
const error = str => console.error(red(str))

const cli = meow(
  `
  Usage
    $ sanity-import -p <projectId> -d <dataset> -t <token> sourceFile.ndjson

  Options
    -p, --project <projectId> Project ID to import to
    -d, --dataset <dataset> Dataset to import to
    -t, --token <token> Token to authenticate with
    --replace Replace documents with the same IDs
    --missing Skip documents that already exist
    --help Show this help

  Examples
    # Import "./my-dataset.ndjson" into dataset "staging"
    $ sanity-import -p myPrOj -d staging -t someSecretToken my-dataset.ndjson

    # Import into dataset "test" from stdin, read token from env var
    $ cat my-dataset.ndjson | sanity-import -p myPrOj -d test -

  Environment variables (fallbacks for missing flags)
    --token = SANITY_IMPORT_TOKEN
`,
  {
    boolean: ['replace', 'missing'],
    alias: {
      p: 'project',
      d: 'dataset',
      t: 'token'
    }
  }
)

const {flags, input, showHelp} = cli
const token = flags.token || process.env.SANITY_IMPORT_TOKEN
const projectId = flags.project
const dataset = flags.dataset
const source = input[0]

if (!projectId) {
  error('Flag `--project` is required')
  showHelp()
}

if (!dataset) {
  error('Flag `--dataset` is required')
  showHelp()
}

if (!token) {
  error('Flag `--token` is required (or set SANITY_IMPORT_TOKEN)')
  showHelp()
}

if (!source) {
  error('Source file is required, use `-` to read from stdin')
  showHelp()
}

let operation = 'create'
if (flags.replace || flags.missing) {
  if (flags.replace && flags.missing) {
    error('Cannot use both `--replace` and `--missing`')
    showHelp()
  }

  operation = flags.replace ? 'createOrReplace' : 'createIfNotExists'
}

// @todo Future improvement
if (/^https:\/\//i.test(source)) {
  error('HTTP(S) URLs are currently not supported')
  showHelp()
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  useCdn: false
})

const sourceStream =
  source === '-' ? process.stdin : fs.createReadStream(source)

sanityImport(sourceStream, {client, operation})
  .then(imported => {
    console.log(
      'Done! Imported %d documents to dataset "%s"',
      imported,
      dataset
    )
  })
  .catch(err => {
    error(err.message)
  })
