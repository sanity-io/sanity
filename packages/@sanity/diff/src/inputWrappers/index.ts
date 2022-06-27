import type {Input} from '../types'
import ArrayWrapper from './array'
import ObjectWrapper from './object'
import StringWrapper from './string'
import BasicWrapper from './basic'

/**
 * Takes an input (any JSON-serializable value) and an annotation, and generates an input
 * object for it, to be used with {@link diffInput | the diffInput() method} and others.
 *
 * @param input - The value to wrap in an input object
 * @param annotation - Annotation attached to the input - will be bound to generated diffs
 * @returns A input object
 * @throws if `input` is not a JSON-serializable type
 * @public
 */
export function wrap<A>(input: unknown, annotation: A): Input<A> {
  if (Array.isArray(input)) {
    return new ArrayWrapper(input, annotation)
  } else if (input === null) {
    return new BasicWrapper('null', input, annotation)
  }

  const type = typeof input
  switch (type) {
    case 'number':
      return new BasicWrapper(type, input as number, annotation)
    case 'boolean':
      return new BasicWrapper(type, input as boolean, annotation)
    case 'object':
      return new ObjectWrapper(input as Record<string, unknown>, annotation)
    case 'string':
      return new StringWrapper(input as string, annotation)
    default:
      throw new Error(`cannot wrap value of type: ${type}`)
  }
}
