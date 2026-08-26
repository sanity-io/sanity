import {type UnresolvedSingletonDefinition} from './types'

/**
 * Define a singleton {@link SingletonDefinition | definition} for use in the
 * `document.singletons` configuration.
 *
 * Note that this defines a singleton _definition_ — the registry entry binding
 * a singleton definition id to a document id and schema type — **not** a
 * singleton document schema. The schema type the definition references is
 * defined separately, using `defineType`.
 *
 * The definition `id` is optional and inherits the definition's `documentId`
 * when omitted. Set it explicitly to be verbose, to guard against future
 * collisions, or to address a singleton universally when different workspaces
 * or environments map it to different document ids.
 *
 * @example
 * ```ts
 * import {defineConfig, defineSingleton} from 'sanity'
 *
 * const settingsSingleton = defineSingleton({
 *   documentId: 'settings',
 *   schemaType: 'settings',
 * })
 *
 * export default defineConfig({
 *   // ...
 *   document: {
 *     singletons: [settingsSingleton],
 *   },
 * })
 * ```
 *
 * @hidden
 * @beta
 */
export function defineSingleton<const T extends Exclude<UnresolvedSingletonDefinition, string>>(
  definition: T,
): T {
  return definition
}
