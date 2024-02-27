import {type CliCommandGroupDefinition} from '@sanity/cli'

// defaultApiVersion is the backend API version used for dataset backup.
export const defaultApiVersion = 'v2024-02-21'

const datasetBackupGroup: CliCommandGroupDefinition = {
  name: 'backup',
  signature: '[COMMAND]',
  description: 'Manage backups.',
  isGroupRoot: true,
}

export default datasetBackupGroup
