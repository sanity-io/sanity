import path from 'path'
import {MIGRATION_SCRIPT_EXTENSIONS, MIGRATIONS_DIRECTORY} from './constants'

export function resolveMigrationScript(workDir: string, migrationName: string) {
  return [migrationName, path.join(migrationName, 'index')].flatMap((location) =>
    MIGRATION_SCRIPT_EXTENSIONS.map((ext) => {
      const relativePath = path.join(MIGRATIONS_DIRECTORY, `${location}.${ext}`)
      const absolutePath = path.resolve(workDir, relativePath)
      let mod
      try {
        // eslint-disable-next-line import/no-dynamic-require
        mod = require(absolutePath)
      } catch (err) {
        // console.error(err)
      }
      return {relativePath, absolutePath, mod}
    }),
  )
}
