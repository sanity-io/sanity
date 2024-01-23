import {CliCommandGroupDefinition} from '@sanity/cli'

// defaultApiVersion is the backend API version used for dataset backup.
export const defaultApiVersion = 'vX'

const datasetBackupGroup: CliCommandGroupDefinition = {
  name: 'dataset-backup',
  isGroupRoot: false,
  signature: '[SUBCOMMAND] [DATASET_NAME]',
  description: 'Manage dataset backups.',
  hideFromHelp: false,
}

export default datasetBackupGroup
