import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'
import {colorizeJson} from '../../util/colorizeJson'

const defaultApiVersion = 'v2022-06-01'

const helpText = `
Run a query against the projects configured dataset

Options
  --pretty colorized JSON output
  --dataset NAME to override dataset
  --project PROJECT to override project ID
  --anonymous Send the query without any authorization token
  --api-version API version to use (defaults to \`${defaultApiVersion}\`)

Environment variables
  \`SANITY_CLI_QUERY_API_VERSION\` - will use the defined API version,
  unless \`--api-version\` is specified.

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
  anonymous?: boolean
  dataset?: string
  project?: string
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
    context: CliCommandContext,
  ): Promise<void> => {
    // Reparsing arguments for improved control of flags
    const {
      pretty,
      dataset,
      project,
      anonymous,
      'api-version': apiVersion,
    } = await parseCliFlags(args)
    const {apiClient, output, chalk, cliConfig} = context
    const [query] = args.argsWithoutOptions

    if (!query) {
      throw new Error('Query must be specified')
    }

    if (!apiVersion) {
      output.warn(chalk.yellow(`--api-version not specified, using \`${defaultApiVersion}\``))
    }

    const requireDataset = !dataset
    const requireProject = !project
    const requireUser = !anonymous

    if (requireProject && !cliConfig?.api?.projectId) {
      throw new Error(
        'No project configured in CLI config - either configure one, or use `--project` flag',
      )
    }

    if (requireDataset && !cliConfig?.api?.dataset) {
      throw new Error(
        'No dataset configured in CLI config - either configure one, or use `--dataset` flag',
      )
    }

    const baseClient = apiClient({requireProject, requireUser}).clone()
    const {dataset: originalDataset, projectId: originalProjectId} = baseClient.config()

    const client = baseClient.config({
      projectId: project || originalProjectId,
      dataset: dataset || originalDataset,
      apiVersion: apiVersion || defaultApiVersion,
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
  // eslint-disable-next-line no-process-env
  const fallbackApiVersion = process.env.SANITY_CLI_QUERY_API_VERSION
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .option('pretty', {type: 'boolean', default: false})
    .option('dataset', {type: 'string'})
    .option('project', {type: 'string'})
    .option('anonymous', {type: 'boolean', default: false})
    .option('api-version', {type: 'string', default: fallbackApiVersion}).argv
}
