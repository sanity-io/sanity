import {dirname} from 'node:path'

import findUp from 'find-up'

const CONFIG_FILENAMES = ['sanity.config.ts', 'sanity.config.js', 'sanity.cli.ts', 'sanity.cli.js']

export async function getProjectRoot(): Promise<string | undefined> {
  const rootConfigPath = await findUp(CONFIG_FILENAMES)

  if (rootConfigPath) {
    return dirname(rootConfigPath)
  }

  return undefined
}
