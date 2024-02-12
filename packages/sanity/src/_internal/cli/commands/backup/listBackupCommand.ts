import {type CliCommandDefinition} from '@sanity/cli'
import {Table} from 'console-table-printer'
import {isAfter, isValid, lightFormat, parse} from 'date-fns'
import {hideBin} from 'yargs/helpers'
import yargs from 'yargs/yargs'

import parseApiErr from '../../actions/backup/parseApiErr'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import {defaultApiVersion} from './backupGroup'

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

function parseCliFlags(args: {argv?: string[]}) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .options('after', {type: 'string'})
    .options('before', {type: 'string'})
    .options('limit', {type: 'number', default: DEFAULT_LIST_BACKUP_LIMIT, alias: 'l'}).argv
}

const listDatasetBackupCommand: CliCommandDefinition<ListDatasetBackupFlags> = {
  name: 'list',
  group: 'backup',
  signature: '[DATASET_NAME]',
  description: 'List available backups for a dataset.',
  helpText,
  action: async (args, context) => {
    const {output, chalk} = context
    const flags = await parseCliFlags(args)
    const [dataset] = args.argsWithoutOptions

    const {projectId, datasetName, token, client} = await resolveApiClient(
      context,
      dataset,
      defaultApiVersion,
    )

    const query: ListBackupRequestQueryParams = {limit: DEFAULT_LIST_BACKUP_LIMIT.toString()}
    if (flags.limit) {
      // We allow limit up to Number.MAX_SAFE_INTEGER to leave it for server-side validation,
      //  while still sending sensible value in limit string.
      if (flags.limit < 1 || flags.limit > Number.MAX_SAFE_INTEGER) {
        throw new Error(
          `Parsing --limit: must be an integer between 1 and ${Number.MAX_SAFE_INTEGER}`,
        )
      }
      query.limit = flags.limit.toString()
    }

    if (flags.before || flags.after) {
      try {
        const parsedBefore = processDateFlags(flags.before)
        const parsedAfter = processDateFlags(flags.after)

        if (parsedAfter && parsedBefore && isAfter(parsedAfter, parsedBefore)) {
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
      const {message} = parseApiErr(error)
      output.error(`${chalk.red(`List dataset backup failed: ${message}`)}\n`)
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
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date())
  if (isValid(parsedDate)) {
    return parsedDate
  }

  throw new Error(`Invalid ${date} date format. Use YYYY-MM-DD`)
}

export default listDatasetBackupCommand
