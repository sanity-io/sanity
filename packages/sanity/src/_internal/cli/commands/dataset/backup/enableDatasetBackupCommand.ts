import {CliCommandDefinition} from '@sanity/cli'
import resolveApiClient from '../../../actions/dataset/backup/resolveApiClient'
import {defaultApiVersion} from './datasetBackupGroup'

const helpText = `
Examples
  sanity dataset-backup enable <dataset-name>
`

const enableDatasetBackupCommand: CliCommandDefinition = {
  name: 'enable',
  group: 'dataset-backup',
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
      output.print(`${chalk.green(`Dataset backup enabled\n`)}`)
    } catch (error) {
      const msg = error.statusCode
        ? error.response.body.message
        : error.message || error.statusMessage
      output.print(`${chalk.red(`Enabling dataset backup failed: ${msg}`)}\n`)
    }
  },
}
export default enableDatasetBackupCommand
