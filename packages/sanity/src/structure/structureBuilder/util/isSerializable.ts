import {isRecord} from 'sanity'

import {type Serializable} from '../StructureNodes'

/**
 * Brands the structure builder classes that {@link isSerializable} recognizes. A well-known
 * symbol (`Symbol.for`) is used instead of `instanceof` checks against the concrete classes,
 * which would create circular imports between the mutually referencing builders (e.g. a list
 * contains list items whose children can be lists), and which break when multiple copies of the
 * package provide the classes.
 *
 * @internal
 */
export const serializableMarker: unique symbol = Symbol.for('sanity.structureBuilder.serializable')

/**
 * Checks for builder instances ({@link Serializable} implementations) by their
 * {@link serializableMarker} brand.
 *
 * @internal
 */
export function isSerializable<T>(value: unknown): value is Serializable<T> {
  return (
    isRecord(value) &&
    (value as Record<PropertyKey, unknown>)[serializableMarker] === true &&
    typeof value.serialize === 'function'
  )
}
