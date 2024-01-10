import type {CliCommandAction} from '@sanity/cli'
import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100

type queryParams = {
  limit: string // The query param object expects strings, not numbers.
  start?: string
  end?: string
}

type ListBackupResponse = {
  backups: ListBackupResponseItem[]
}

type ListBackupResponseItem = {
  id: string
  createdAt: string
}

export const listDatasetBackupsAction: CliCommandAction = async (args, context) => {
  const {apiClient, output, prompt, chalk} = context
  const flags = args.extOptions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_cmdName, dataset] = args.argsWithoutOptions
  let client = apiClient({requireProject: false})

  const projectId = client.config().projectId
  const datasetName = await (dataset || promptForDatasetName(prompt))
  client = client.clone().config({dataset: datasetName})

  const query: queryParams = {limit: DEFAULT_LIMIT.toString()}
  if (flags.limit) {
    query.limit = parseLimit(flags.limit)
  }

  if (flags.start) {
    try {
      query.start = new Date(flags.start.toString()).toISOString()
    } catch (err) {
      throw new Error(`Parsing <start> timestamp: ${err}`)
    }
  }

  if (flags.end) {
    try {
      query.end = new Date(flags.end.toString()).toISOString()
    } catch (err) {
      throw new Error(`Parsing <end> timestamp: ${err}`)
    }
  }

  if (query.start && query.end && query.start >= query.end) {
    throw new Error('<start> timestamp must be before <end>')
  }

  let response
  try {
    response = await client.request<ListBackupResponse>({
      method: 'GET',
      uri: `/projects/${projectId}/datasets/${datasetName}/backups`,
      query: {...query},
    })
  } catch (error) {
    const msg = error.statusCode
      ? error.response.body.message
      : error.message || error.statusMessage
    output.error(`${chalk.red(`List dataset backup failed: ${msg}`)}\n`)
  }

  if (response && response.backups) {
    output.print(`Fetched ${response.backups.length} backups`)
    if (flags['with-created-at']) {
      output.print(
        response.backups.map((b: ListBackupResponseItem) => JSON.stringify(b)).join('\n'),
      )
      return
    }
    output.print(response.backups.map((b: ListBackupResponseItem) => b.id).join('\n'))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLimit(input: any): string {
  if (input === null || input === undefined || isNaN(input)) {
    throw new Error('<limit> must be an integer')
  }

  const limit = parseInt(input, 10)
  if (limit < 1 || limit > MAX_LIMIT || isNaN(limit)) {
    throw new Error('<limit> must be an integer between 1 and 100')
  }
  return limit.toString() // The query param object expects string inputs, not numbers.
}
