import type {CliCommandDefinition} from '@sanity/cli'
import toggleDatasetBackup from './toggleDatasetBackup'

const disableHelpText = `
Examples
  sanity dataset backups disable <name>
`

const disableDatasetBackupCommand: CliCommandDefinition = {
  name: 'backup disable',
  group: 'dataset',
  signature: '[datasetName]',
  helpText: disableHelpText,
  description: 'Disable dataset backups for this dataset',
  action: async (args: any, context: any) => {
    await toggleDatasetBackup(false, args, context)
  },
}

export default disableDatasetBackupCommand
