import type {CliCommandDefinition} from '@sanity/cli'
import toggleDatasetBackup from './toggleDatasetBackup'

const enableHelpText = `
Examples
  sanity dataset backup enable <name>
`

const enableDatasetBackupCommand: CliCommandDefinition = {
  name: 'backup enable',
  group: 'dataset',
  signature: '[datasetName]',
  helpText: enableHelpText,
  description: 'Enable dataset backups for this dataset',
  action: async (args: any, context: any) => {
    await toggleDatasetBackup(true, args, context)
  },
}

export default enableDatasetBackupCommand
