import type {CliCommandDefinition} from '@sanity/cli'
import {Table} from 'console-table-printer'
import {lightFormat} from 'date-fns'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import {defaultApiVersion, validateLimit} from './backupGroup'

const DEFAULT_LIST_BACKUP_LIMIT = 30

interface ListDatasetBackupFlags {
  before?: string
  after?: string
  limit?: string
}

type ListBackupRequestQueryParams = {
  start?: string
  end?: string
  limit: string
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
  --limit <int>     Maximum number of backups returned. Default 30. Cannot exceed 100.
  --after <string>  Only return backups after this timestamp (inclusive)
  --before <string> Only return backups before this timestamp (exclusive). Cannot be younger than <after> if specified.

Examples
  sanity backup list DATASET_NAME
  sanity backup list DATASET_NAME --limit 50
  sanity backup list DATASET_NAME --after 2024-01-01 --limit 10
  sanity backup list DATASET_NAME --after 2024-01-01T12:00:01Z --before 2024-01-10
`

const listDatasetBackupCommand: CliCommandDefinition<ListDatasetBackupFlags> = {
  name: 'list',
  group: 'backup',
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
      try {
        query.limit = validateLimit(flags.limit)
      } catch (err) {
        throw new Error(`Parsing --limit: ${err}`)
      }
    }

    if (flags.after) {
      try {
        query.start = new Date(flags.after).toISOString()
      } catch (err) {
        throw new Error(`Parsing --after date: ${err}`)
      }
    }

    if (flags.before) {
      try {
        query.end = new Date(flags.before).toISOString()
      } catch (err) {
        throw new Error(`Parsing --before date: ${err}`)
      }
    }

    if (query.start && query.end && query.start >= query.end) {
      throw new Error('--after timestamp must be before --before')
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
      if (response.backups.length === 0) {
        output.print('No backups found.')
        return
      }

      const table = new Table({
        columns: [
          {name: 'resource', title: 'RESOURCE', alignment: 'left'},
          {name: 'createdAt', title: 'CREATED AT', alignment: 'left'},
          {name: 'backupId', title: 'BACKUP ID', alignment: 'left'},
        ],
      })

      response.backups.forEach((backup: ListBackupResponseItem) => {
        const {id, createdAt} = backup
        table.addRow({
          resource: 'Dataset',
          createdAt: lightFormat(Date.parse(createdAt), 'yyyy-MM-dd'),
          backupId: id,
        })
      })

      table.printTable()
    }
  },
}

export default listDatasetBackupCommand
