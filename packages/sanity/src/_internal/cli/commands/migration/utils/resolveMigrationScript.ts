import path from 'node:path'

import {type Migration} from '@sanity/migrate'
import {isPlainObject} from 'lodash'

import {MIGRATION_SCRIPT_EXTENSIONS, MIGRATIONS_DIRECTORY} from '../constants'

interface ResolvedMigrationScript {
  /**
   * Relative path from the working directory to the migration script
   */
  relativePath: string

  /**
   * Absolute path to the migration script
   */
  absolutePath: string

  /**
   * The migration module, if it could be resolved - otherwise `undefined`
   */
  mod?: {default: Migration; up?: unknown; down?: unknown}
}

/**
 * Resolves the potential paths to a migration script.
 * Considers the following paths (where `<ext>` is 'mjs', 'js', 'ts' or 'cjs'):
 *
 * - `<migrationsDir>/<migrationName>.<ext>`
 * - `<migrationsDir>/<migrationName>/index.<ext>`
 *
 * Note that all possible paths are returned, even if the files do not exist.
 * Check the `mod` property to see if a module could actually be loaded.
 *
 * @param workDir - Working directory of the studio
 * @param migrationName - The name of the migration directory to resolve
 * @returns An array of potential migration scripts
 * @internal
 */
export function resolveMigrationScript(
  workDir: string,
  migrationName: string,
): ResolvedMigrationScript[] {
  return [migrationName, path.join(migrationName, 'index')].flatMap((location) =>
    MIGRATION_SCRIPT_EXTENSIONS.map((ext) => {
      const relativePath = path.join(MIGRATIONS_DIRECTORY, `${location}.${ext}`)
      const absolutePath = path.resolve(workDir, relativePath)
      let mod
      try {
        // eslint-disable-next-line import/no-dynamic-require
        mod = require(absolutePath)
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
          throw new Error(`Error: ${err.message}"`)
        }
      }
      return {relativePath, absolutePath, mod}
    }),
  )
}

/**
 * Checks whether or not the passed resolved migration script is actually loadable (eg has a default export)
 *
 * @param script - The resolved migration script to check
 * @returns `true` if the script is loadable, `false` otherwise
 * @internal
 */
export function isLoadableMigrationScript(
  script: ResolvedMigrationScript,
): script is Required<ResolvedMigrationScript> {
  if (typeof script.mod === 'undefined' || !isPlainObject(script.mod.default)) {
    return false
  }

  const mod = script.mod.default
  return typeof mod.title === 'string' && mod.migrate !== undefined
}
