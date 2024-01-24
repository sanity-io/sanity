import {CliCommandGroupDefinition} from '@sanity/cli'

// defaultApiVersion is the backend API version used for dataset backup.
export const defaultApiVersion = 'vX'

const datasetBackupGroup: CliCommandGroupDefinition = {
  name: 'backup',
  signature: '[COMMAND]',
  description: 'Manage dataset backups.',
  isGroupRoot: true,
  hideFromHelp: false,
}

export function validateLimit(limit: string): string {
  const parsed = parseInt(limit, 10)

  // We allow limit up to Number.MAX_SAFE_INTEGER to leave it for server-side validation,
  //  while still sending sensible value in limit string.
  if (isNaN(parsed) || parsed < 1 || parsed > Number.MAX_SAFE_INTEGER) {
    throw new Error(`--limit must be an integer between 1 and ${Number.MAX_SAFE_INTEGER}`)
  }

  return limit.toString()
}

export default datasetBackupGroup
