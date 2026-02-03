import {type CliCommandDefinition} from '@sanity/cli'

import parseApiErr from '../../actions/backup/parseApiErr'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import {defaultApiVersion} from './backupGroup'

const helpText = `
Examples
  sanity backup enable DATASET_NAME
`

const enableDatasetBackupCommand: CliCommandDefinition = {
  name: 'enable',
  group: 'backup',
  signature: '[DATASET_NAME]',
  description: 'Enable backup for a dataset.',
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
          enabled: true,
        },
      })

      output.print(
        `${chalk.green(
          `Enabled backups for dataset ${datasetName}.\nPlease note that it may take up to 24 hours before the first backup is created.\n`,
        )}`,
      )

      output.print(
        `${chalk.bold(`Retention policies may apply depending on your plan and agreement.\n`)}`,
      )
    } catch (error) {
      const {message} = parseApiErr(error)
      output.print(`${chalk.red(`Enabling dataset backup failed: ${message}`)}\n`)
    }
  },
}
export default enableDatasetBackupCommand
