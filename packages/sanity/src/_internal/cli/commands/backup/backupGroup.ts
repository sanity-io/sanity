import {type CliCommandGroupDefinition} from '@sanity/cli'

// defaultApiVersion is the backend API version used for dataset backup.
// First version of the backup API is vX since this feature is not yet released
// and formal API documentation is pending.
export const defaultApiVersion = 'vX'

const datasetBackupGroup: CliCommandGroupDefinition = {
  name: 'backup',
  signature: '[COMMAND]',
  description: 'Manage dataset backups.',
  isGroupRoot: true,
  hideFromHelp: true,
}

export default datasetBackupGroup
