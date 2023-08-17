import {parseISO, formatDistanceToNow, formatDistance} from 'date-fns'
import {Table} from 'console-table-printer'
import type {CliCommandContext} from '@sanity/cli'

interface ListFlags {
  offset?: number
  limit?: number
}

type CopyDatasetListResponse = {
  id: string
  state: string
  createdAt: string
  updatedAt: string
  sourceDataset: string
  targetDataset: string
  withHistory: boolean
}[]

export async function listDatasetCopyJobs(
  flags: ListFlags,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, output, chalk} = context
  const client = apiClient()
  const projectId = client.config().projectId
  const query: {offset?: string; limit?: string} = {}
  let response

  if (flags.offset && flags.offset >= 0) {
    query.offset = `${flags.offset}`
  }
  if (flags.limit && flags.limit > 0) {
    query.limit = `${flags.limit}`
  }

  try {
    response = await client.request<CopyDatasetListResponse>({
      method: 'GET',
      uri: `/projects/${projectId}/datasets/copy`,
      query,
    })
  } catch (error) {
    if (error.statusCode) {
      output.error(`${chalk.red(`Dataset copy list failed:\n${error.response.body.message}`)}\n`)
    } else {
      output.error(`${chalk.red(`Dataset copy list failed:\n${error.message}`)}\n`)
    }
  }

  if (response && response.length > 0) {
    const table = new Table({
      title: 'Dataset copy jobs for this project in descending order',
      columns: [
        {name: 'id', title: 'Job ID', alignment: 'left'},
        {name: 'sourceDataset', title: 'Source Dataset', alignment: 'left'},
        {name: 'targetDataset', title: 'Target Dataset', alignment: 'left'},
        {name: 'state', title: 'State', alignment: 'left'},
        {name: 'withHistory', title: 'With history', alignment: 'left'},
        {name: 'timeStarted', title: 'Time started', alignment: 'left'},
        {name: 'timeTaken', title: 'Time taken', alignment: 'left'},
      ],
    })

    response.forEach((job) => {
      const {id, state, createdAt, updatedAt, sourceDataset, targetDataset, withHistory} = job

      let timeStarted = ''
      if (createdAt !== '') {
        timeStarted = formatDistanceToNow(parseISO(createdAt))
      }

      let timeTaken = ''
      if (updatedAt !== '') {
        timeTaken = formatDistance(parseISO(updatedAt), parseISO(createdAt))
      }

      let color
      switch (state) {
        case 'completed':
          color = 'green'
          break
        case 'failed':
          color = 'red'
          break
        case 'pending':
          color = 'yellow'
          break
        default:
          color = ''
      }

      table.addRow(
        {
          id,
          state,
          withHistory,
          timeStarted: `${timeStarted} ago`,
          timeTaken,
          sourceDataset,
          targetDataset,
        },
        {color},
      )
    })

    table.printTable()
  } else {
    output.print("This project doesn't have any dataset copy jobs")
  }
}
