import type {CliCommandDefinition} from '@sanity/cli'
import oneline from 'oneline'
import toggleDatasetBackupHandler from './toggleDatasetBackupHandler'
import {listDatasetBackupsAction} from './listDatasetBackups'
import {getDatasetBackupAction} from './getDatasetBackupAction'

const helpText = `
Below are examples of the backup subcommand

Enable Backup
  sanity dataset backup enable <name>

Disable Backup
  sanity dataset backups disable <name>

List Backup
  Options
    -- limit <int> Maximum number of backups returned. Default 30. Cannot exceed 100.
    -- start <timestamp> Only return backups after this timestamp (inclusive)
    -- end <timestamp> Only return backups before this timestamp (exclusive). Cannot be younger than <start> if specified.

  Example
    sanity dataset backup list <name>
    sanity dataset backup list --limit 50 <name>
    sanity dataset backup list --start 2020-01-01T09:00:00 --limit 10 <name>

Download Backup
  Options
    --to <string> The file path the backup should download to
    --from <string> The backup ID to download (required)

  Example
    sanity dataset backups get <name> --from 2020-01-01-backup-abcd1234
    sanity dataset backups get <name> --from 2020-01-01-backup-abcd1234 --to /path/to/file
`

const datasetBackupCommands: CliCommandDefinition = {
  name: 'backup',
  group: 'dataset',
  signature: 'SUBCOMMAND [DATASET_NAME]',
  helpText,
  description: 'You can manage your dataset backup using this command.',
  action: async (args, context) => {
    const [verb] = args.argsWithoutOptions
    switch (verb) {
      case 'enable':
        await toggleDatasetBackupHandler(args, context, true)
        break
      case 'disable':
        await toggleDatasetBackupHandler(args, context, false)
        break
      case 'list':
        await listDatasetBackupsAction(args, context)
        break
      case 'get':
        await getDatasetBackupAction(args, context)
        break
      default:
        throw new Error(oneline`
          Invalid command provided. Available commands are: enable, disable, list and download.
          For more guide run the help command 'sanity dataset backup --help'
        `)
    }
  },
}

export default datasetBackupCommands
