import {type CliCommandContext} from '@sanity/cli'

import {defaultApiVersion} from '../../commands/backup/backupGroup'
import resolveApiClient from './resolveApiClient'

// maxBackupIdsShown is the maximum number of backup IDs to show in the prompt.
// Higher numbers will cause the prompt to be slow.
const maxBackupIdsShown = 100

async function chooseBackupIdPrompt(
  context: CliCommandContext,
  datasetName: string,
): Promise<string> {
  const {prompt} = context

  const {projectId, token, client} = await resolveApiClient(context, datasetName, defaultApiVersion)

  try {
    // Fetch last $maxBackupIdsShown backups for this dataset.
    // We expect here that API returns backups sorted by creation date in descending order.
    const response = await client.request({
      headers: {Authorization: `Bearer ${token}`},
      uri: `/projects/${projectId}/datasets/${datasetName}/backups`,
      query: {limit: maxBackupIdsShown.toString()},
    })

    if (response?.backups?.length > 0) {
      const backupIdChoices = response.backups.map((backup: {id: string}) => ({
        value: backup.id,
      }))
      const selected = await prompt.single({
        message: `Select backup ID to use (only last ${maxBackupIdsShown} shown)`,
        type: 'list',
        choices: backupIdChoices,
      })

      return selected
    }
  } catch (err) {
    throw new Error(`Failed to fetch backups for dataset ${datasetName}: ${err.message}`)
  }

  throw new Error('No backups found')
}

export default chooseBackupIdPrompt
