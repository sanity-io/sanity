import {type SingletonDefinition} from 'sanity'

import {SerializeError} from '../SerializeError'
import {type SerializePath} from '../StructureNodes'
import {type StructureContext} from '../types'

/**
 * Resolve a singleton definition from the `document.singletons` registry.
 *
 * @internal
 */
export function getSingletonDefinition(
  context: StructureContext,
  singletonId: string,
  pathHint: SerializePath = [],
): SingletonDefinition {
  const definition = context.document.singletons.find((singleton) => singleton.id === singletonId)

  if (typeof definition === 'undefined') {
    throw new SerializeError(
      `No singleton with id "${singletonId}" found. Did you add it to \`document.singletons\`?`,
      pathHint,
      singletonId,
    )
  }

  return definition
}
