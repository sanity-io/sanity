import {Input} from '../types'
import ArrayWrapper from './array'
import ObjectWrapper from './object'
import StringWrapper from './string'
import BasicWrapper from './basic'

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
