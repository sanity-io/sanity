import {object} from '@optique/core/constructs'
import {message, optionName} from '@optique/core/message'
import {optional, withDefault} from '@optique/core/modifiers'
import {negatableFlag, option} from '@optique/core/primitives'
import {choice, integer, string} from '@optique/core/valueparser'
import {run as runCli} from '@optique/run'
import {readEnv} from '@repo/utils'
import {createClient} from '@sanity/client'
import {tap} from 'rxjs'

import {run} from './run'
import {book} from './templates/book'
import {liveEdit} from './templates/liveEdit'
import {species} from './templates/species'
import {validation} from './templates/validation'

const templates = {
  validation,
  book,
  species,
  liveEdit,
}
const templateNames = Object.keys(templates) as (keyof typeof templates)[]

const args = runCli(
  object(
    {
      template: option('-t', '--template', choice(templateNames), {
        description: message`Template to use`,
      }),
      dataset: withDefault(
        option(
          '--dataset',
          string({
            metavar: 'DATASET',
            pattern: /^\S+$/,
            errors: {
              patternMismatch: message`Dataset name cannot be empty or contain whitespace.`,
            },
          }),
          {
            description: message`Dataset to generate documents in`,
          },
        ),
        'test',
      ),
      number: withDefault(
        option('-n', '--number', integer({min: 1, metavar: 'COUNT'}), {
          description: message`Number of documents to generate`,
        }),
        1,
      ),
      draft: withDefault(
        negatableFlag(
          {positive: '--draft', negative: '--no-draft'},
          {description: message`Generate draft documents`},
        ),
        true,
      ),
      published: withDefault(
        negatableFlag(
          {positive: '--published', negative: '--no-published'},
          {description: message`Generate published documents`},
        ),
        false,
      ),
      bundle: optional(
        option('--bundle', string({metavar: 'BUNDLE[,BUNDLE...]'}), {
          description: message`Bundle(s) to generate documents in (comma-separated)`,
        }),
      ),
      size: optional(
        option('--size', integer({min: 1, metavar: 'BYTES'}), {
          description: message`Size (in bytes) of the generated document (will be approximated)`,
        }),
      ),
      concurrency: optional(
        option('-c', '--concurrency', integer({min: 1, metavar: 'COUNT'}), {
          description: message`Number of concurrent requests`,
        }),
      ),
    },
    {
      errors: {
        // --template is the only required option, so running out of input can
        // only mean it's missing — name it instead of "No matching option found."
        endOfInput: message`Missing required ${optionName('--template')} option.`,
      },
    },
  ),
  {
    programName: 'generate-documents',
    brief: message`Generate test documents in a Sanity dataset from a template`,
    footer: message`Requires the TEST_STUDIO_WRITE_TOKEN environment variable (run via "pnpm generate:docs", which loads .env files). Add more templates in scripts/generate-documents/templates/.`,
    help: {option: {names: ['-h', '--help']}},
    aboveError: 'usage',
    showDefault: true,
    showChoices: true,
  },
)

const template = templates[args.template]

type KnownEnvVar = 'TEST_STUDIO_WRITE_TOKEN'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: args.dataset,
  token: readEnv<KnownEnvVar>('TEST_STUDIO_WRITE_TOKEN'),
  apiVersion: '2024-07-31',
  useCdn: false,
})

run({
  bundles: args.bundle
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  draft: args.draft,
  published: args.published,
  concurrency: args.concurrency,
  number: args.number,
  size: args.size,
  template,
  client,
})
  .pipe(
    tap({
      next: (doc) => {
        console.log('Created', doc._id)
      },
      error: console.error,
    }),
  )
  .subscribe()
