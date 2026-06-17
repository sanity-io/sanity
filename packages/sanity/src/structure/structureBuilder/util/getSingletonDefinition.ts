import {type DocumentSingletonDefinition} from '@sanity/types'

import {HELP_URL, SerializeError} from '../SerializeError'
import {type SerializePath} from '../StructureNodes'
import {type StructureContext} from '../types'

/**
 * Resolves the singleton definition for a schema type, throwing a
 * `SerializeError` with a clear message if the schema type is missing or is
 * not a singleton.
 *
 * Used by the `S.document().singleton()`, `S.listItem().singleton()`, and
 * `S.list().singletons()` helpers so they all surface consistent errors when
 * given a non-singleton (or unknown) schema type name.
 *
 * @internal
 */
export function getSingletonDefinition(
  context: StructureContext,
  schemaTypeName: string,
  pathHint: SerializePath = [],
): DocumentSingletonDefinition {
  const type = context.schema.get(schemaTypeName)
  if (!type) {
    throw new SerializeError(
      `Could not find type "${schemaTypeName}" in schema`,
      pathHint,
      undefined,
    ).withHelpUrl(HELP_URL.SCHEMA_TYPE_NOT_FOUND)
  }
  const singleton = type.singleton
  if (!singleton?.documentId) {
    throw new SerializeError(
      `Schema type "${schemaTypeName}" is not a singleton. ` +
        `Add \`singleton: { documentId: '<id>' }\` to its schema definition.`,
      pathHint,
      undefined,
    )
  }
  return singleton
}
