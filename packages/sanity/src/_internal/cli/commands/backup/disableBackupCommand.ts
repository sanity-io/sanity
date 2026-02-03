import {type CliCommandDefinition} from '@sanity/cli'

import parseApiErr from '../../actions/backup/parseApiErr'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import {defaultApiVersion} from './backupGroup'

const helpText = `
Examples
  sanity backup disable DATASET_NAME
`

const disableDatasetBackupCommand: CliCommandDefinition = {
  name: 'disable',
  group: 'backup',
  signature: '[DATASET_NAME]',
  description: 'Disable backup for a dataset.',
  helpText,
  action: async (args, context) => {
    const {output, chalk} = context
    const [dataset] = args.argsWithoutOptions
    const {projectId, datasetName, token, client} = await resolveApiClient(
      context,
      dataset,
      defaultApiVersion,
    )

    try {
      await client.request({
        method: 'PUT',
        headers: {Authorization: `Bearer ${token}`},
        uri: `/projects/${projectId}/datasets/${datasetName}/settings/backups`,
        body: {
          enabled: false,
        },
      })
      output.print(`${chalk.green(`Disabled daily backups for dataset ${datasetName}\n`)}`)
    } catch (error) {
      const {message} = parseApiErr(error)
      output.print(`${chalk.red(`Disabling dataset backup failed: ${message}`)}\n`)
    }
  },
}

export default disableDatasetBackupCommand
