import {isRecord} from 'sanity'

import {type Serializable} from '../StructureNodes'

/**
 * Structural check for builder instances ({@link Serializable} implementations). Used instead of
 * `instanceof` checks against the concrete builder classes, which would create circular imports
 * between the mutually referencing builders (e.g. a list contains list items whose children can
 * be lists), and which break when multiple copies of the package provide the classes.
 *
 * @internal
 */
export function isSerializable<T>(value: unknown): value is Serializable<T> {
  return isRecord(value) && typeof value.serialize === 'function'
}
