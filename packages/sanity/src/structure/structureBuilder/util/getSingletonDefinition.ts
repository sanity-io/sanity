import {type SingletonDefinition} from 'sanity'

import {SerializeError} from '../SerializeError'
import {type SerializePath} from '../StructureNodes'
import {type StructureContext} from '../types'

/**
 * Resolves a singleton definition from the `document.singletons` registry,
 * throwing a `SerializeError` with a clear message when no definition exists
 * for the provided singleton definition id.
 *
 * Used by the `S.document().singleton()`, `S.listItem().singleton()`, and
 * `S.list().singletons()` helpers so they all surface consistent errors.
 *
 * @internal
 */
export function getSingletonDefinition(
  context: StructureContext,
  singletonId: string,
  pathHint: SerializePath = [],
): SingletonDefinition {
  const definition = context.document.singletons.find((singleton) => singleton.id === singletonId)
  if (!definition) {
    throw new SerializeError(
      `No singleton with id "${singletonId}" found. Did you add it to \`document.singletons\`?`,
      pathHint,
      singletonId,
    )
  }
  return definition
}
