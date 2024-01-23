import type {CliCommandDefinition} from '@sanity/cli'
import resolveApiClient from '../../../actions/dataset/backup/resolveApiClient'
import {defaultApiVersion} from './datasetBackupGroup'

const DEFAULT_LIST_BACKUP_LIMIT = 30

interface ListDatasetBackupFlags {
  limit?: string
  start?: string
  end?: string
  'with-created-at'?: boolean
}

type ListBackupRequestQueryParams = {
  start?: string
  end?: string
  limit?: string
}

type ListBackupResponse = {
  backups: ListBackupResponseItem[]
}

type ListBackupResponseItem = {
  id: string
  createdAt: string
}

const helpText = `
Options
  --limit <int>    Maximum number of backups returned. Default 30. Cannot exceed 100.
  --start <string> Only return backups after this timestamp (inclusive)
  --end <string>   Only return backups before this timestamp (exclusive). Cannot be younger than <start> if specified.

Examples
  sanity dataset-backup list <dataset-name>
  sanity dataset-backup list <dataset-name> --limit 50
  sanity dataset-backup list <dataset-name> --start 2020-01-01T09:00:00 --limit 10
`

const listDatasetBackupCommand: CliCommandDefinition<ListDatasetBackupFlags> = {
  name: 'list',
  group: 'dataset-backup',
  signature: '[DATASET_NAME]',
  description: 'List available backups for a dataset.',
  helpText,
  action: async (args, context) => {
    const {output, chalk} = context
    const flags = args.extOptions
    const [dataset] = args.argsWithoutOptions

    const {projectId, datasetName, token, client} = await resolveApiClient(
      context,
      dataset,
      defaultApiVersion,
    )

    const query: ListBackupRequestQueryParams = {limit: DEFAULT_LIST_BACKUP_LIMIT.toString()}
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
        headers: {Authorization: `Bearer ${token}`},
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
      if (flags['with-created-at']) {
        output.print(
          response.backups.map((b: ListBackupResponseItem) => JSON.stringify(b)).join('\n'),
        )
        return
      }
      output.print(response.backups.map((b: ListBackupResponseItem) => b.id).join('\n'))
    }
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLimit(input: any): string {
  if (input === null || input === undefined || isNaN(input)) {
    throw new Error('<limit> must be an integer')
  }

  const limit = parseInt(input, 10)

  // Avoid applying range based client-side validations on limit, because:
  // 1. Allows flexibility for the API to change the limit range in the future, without requiring a CLI update.
  // 2. API will return an error if the limit is invalid.
  if (isNaN(limit)) {
    throw new Error('<limit> must be a valid integer')
  }

  // The query param object expects string inputs, not numbers.
  return limit.toString()
}

export default listDatasetBackupCommand
