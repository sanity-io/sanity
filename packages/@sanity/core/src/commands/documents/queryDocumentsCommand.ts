import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import colorizeJson from '../../util/colorizeJson'
import type {CliCommandArguments, CliCommandContext} from '../../types'

const helpText = `
Run a query against the projects configured dataset

Options
  --pretty colorized JSON output
  --dataset NAME to override dataset
  --api-version API version to use (defaults to \`v1\`)

Examples
  # Fetch 5 documents of type "movie"
  sanity documents query '*[_type == "movie"][0..4]'

  # Fetch title of the oldest movie in the dataset named "staging"
  sanity documents query '*[_type == "movie"]|order(releaseDate asc)[0]{title}' --dataset staging

  # Use API version v2021-06-07 and do a query
  sanity documents query --api-version v2021-06-07 '*[_id == "header"] { "headerText": pt::text(body) }'
`

interface CliQueryCommandFlags {
  pretty?: boolean
  dataset?: string
  apiVersion?: string
}

export default {
  name: 'query',
  group: 'documents',
  signature: '[QUERY]',
  helpText,
  description: 'Query for documents',
  action: async (
    args: CliCommandArguments<CliQueryCommandFlags>,
    context: CliCommandContext
  ): Promise<void> => {
    // Reparsing arguments for improved control of flags
    const {pretty, dataset, 'api-version': apiVersion} = parseCliFlags(args)
    const {apiClient, output, chalk} = context
    const [query] = args.argsWithoutOptions

    if (!query) {
      throw new Error('Query must be specified')
    }

    if (!apiVersion) {
      output.warn(chalk.yellow('--api-version not specified, using `v1`'))
    }

    const baseClient = apiClient().clone()
    const {dataset: originalDataset} = baseClient.config()
    const client = baseClient.config({
      dataset: dataset || originalDataset,
      apiVersion: apiVersion || 'v1',
    })

    try {
      const docs = await client.fetch(query)
      if (!docs) {
        throw new Error('Query returned no results')
      }

      output.print(pretty ? colorizeJson(docs, chalk) : JSON.stringify(docs, null, 2))
    } catch (err) {
      throw new Error(`Failed to run query:\n${err.message}`)
    }
  },
}

function parseCliFlags(args: CliCommandArguments<CliQueryCommandFlags>) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .option('pretty', {type: 'boolean', default: false})
    .option('dataset', {type: 'string'})
    .option('api-version', {type: 'string'}).argv
}
