import {type Migration} from './types'

/**
 * @public
 *
 * Helper function for defining a Sanity content migration. This function does not do anything on its own;
 * it exists to check that your schema definition is correct, and help autocompletion in your IDE.
 *
 * {@link https://www.sanity.io/docs/schema-and-content-migrations#af2be129ccd6}

 * @example Basic usage
 *
 * ```ts
 * export default defineMigration({
 *  title: 'Make sure all strings with “acme” is uppercased to “ACME”',
 *  migrate: {
 *    string(node, path, context) {
 *      if (node === "acme") {
 *        return set(node.toUpperCase())
 *      }
 *    },
 *  },
 * })
 * ```
 * @param migration - The migration definition
 *
 * See {@link Migration}
 */
export function defineMigration<T extends Migration>(migration: T): T {
  return migration
}
