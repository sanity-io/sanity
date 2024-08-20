import path from 'node:path'
import {parseArgs} from 'node:util'

import {createClient} from '@sanity/client'
import {tap} from 'rxjs'

import {readEnv} from '../utils/envVars'
import {run} from './run'
import {book} from './templates/book'
import {species} from './templates/species'
import {validation} from './templates/validation'

const {values: args} = parseArgs({
  args: process.argv.slice(2),
  options: {
    number: {
      type: 'string',
      short: 'n',
      default: '1',
    },
    dataset: {
      type: 'string',
    },
    bundle: {
      type: 'string',
    },
    draft: {
      type: 'boolean',
    },
    published: {
      type: 'boolean',
    },
    size: {
      type: 'string',
    },
    concurrency: {
      type: 'string',
      short: 'c',
    },
    template: {
      type: 'string',
      short: 't',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
})

const templates = {
  validation: validation,
  book: book,
  species: species,
}

const HELP_TEXT = `Usage: tsx --env-file=.env.local ./${path.relative(process.cwd(), process.argv[1])} --template <template> [arguments]

     Arguments:
      --template, -t <template>: Template to use (required). Possible values: ${Object.keys(templates).join(', ')}

      --dataset: Dataset to generate documents in (defaults to 'test')
      --amount, -n <int>: Number of documents to generate
      --draft: Generate draft documents
      --published: Generate published documents
      --bundle <string>: Bundle to generate documents in
      --size <bytes>: Size (in bytes) of the generated document (will be approximated)
      --concurrency, -c <int>: Number of concurrent requests
      --help, -h: Show this help message

  Add more templates by adding them to the "./${path.relative(process.cwd(), path.join(__dirname, './templates'))}" directory.
    `

if (args.help) {
  // eslint-disable-next-line no-console
  console.log(HELP_TEXT)
  process.exit(0)
}

if (!args.template) {
  console.error('Error: Missing required `--template` argument\n')
  console.error(HELP_TEXT)
  process.exit(1)
}
if (!(args.template in templates)) {
  console.error(`Error: Template "${args.template}" does not exist. Available templates: ${Object.keys(templates).join(', ')}
`)
  console.error(HELP_TEXT)
  process.exit(1)
}

const template = templates[args.template as keyof typeof templates]

type KnownEnvVar = 'TEST_STUDIO_WRITE_TOKEN'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: args.dataset || 'test',
  token: readEnv<KnownEnvVar>('TEST_STUDIO_WRITE_TOKEN'),
  apiVersion: '2024-07-31',
  useCdn: false,
})

run({
  bundle: args.bundle,
  draft: args.draft || true,
  published: args.published,
  concurrency: args.concurrency ? Number(args.concurrency) : undefined,
  number: args.number ? Number(args.number) : undefined,
  size: args.size ? Number(args.size) : undefined,
  template,
  client,
})
  .pipe(
    tap({
      next: (doc) => {
        // eslint-disable-next-line no-console
        console.log('Created', doc._id)
      },
      error: console.error,
    }),
  )
  .subscribe()
