import {type CliCommandGroupDefinition} from '@sanity/cli'

// defaultApiVersion is the backend API version used for dataset backup.
export const defaultApiVersion = 'v2024-02-21'

const datasetBackupGroup: CliCommandGroupDefinition = {
  name: 'backup',
  signature: '[COMMAND]',
  description: 'Manage dataset backups.',
  isGroupRoot: true,
  hideFromHelp: true,
}

export default datasetBackupGroup
