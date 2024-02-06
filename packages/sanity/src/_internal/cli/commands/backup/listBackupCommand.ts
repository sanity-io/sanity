import type {CliCommandDefinition} from '@sanity/cli'
import {Table} from 'console-table-printer'
import {isAfter, isValid, lightFormat, parse} from 'date-fns'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import {defaultApiVersion, validateLimit} from './backupGroup'

const DEFAULT_LIST_BACKUP_LIMIT = 30

interface ListDatasetBackupFlags {
  before?: string
  after?: string
  limit?: string
}

type ListBackupRequestQueryParams = {
  before?: string
  after?: string
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
  --limit <int>     Maximum number of backups returned. Default 30.
  --after <string>  Only return backups after this date (inclusive)
  --before <string> Only return backups before this date (exclusive). Cannot be younger than <after> if specified.

Examples
  sanity backup list DATASET_NAME
  sanity backup list DATASET_NAME --limit 50
  sanity backup list DATASET_NAME --after 2024-01-31 --limit 10
  sanity backup list DATASET_NAME --after 2024-01-31 --before 2024-01-10
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

    if (flags.before || flags.after) {
      try {
        const parsedBefore = processDateFlags(flags.before)
        const parsedAfter = processDateFlags(flags.after)

        if (parsedAfter && parsedBefore && isAfter(parsedBefore, parsedAfter)) {
          throw new Error('--after date must be before --before')
        }

        query.before = flags.before
        query.after = flags.after
      } catch (err) {
        throw new Error(`Parsing date flags: ${err}`)
      }
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
          createdAt: lightFormat(Date.parse(createdAt), 'yyyy-MM-dd HH:mm:ss'),
          backupId: id,
        })
      })

      table.printTable()
    }
  },
}

function processDateFlags(date: string | undefined): Date | undefined {
  if (!date) return undefined
  const parsedDate = parse(date, 'YYYY-MM-DD', new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  throw new Error(`Invalid ${date} date format. Use YYYY-MM-DD`)
}

export default listDatasetBackupCommand
