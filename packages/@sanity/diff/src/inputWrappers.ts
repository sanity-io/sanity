import {type ArrayInput, type Input, type ObjectInput, type StringInput} from './types'

// The wrapper classes and `wrap` are mutually recursive (container wrappers lazily wrap their
// members), so they live in the same module to avoid circular imports.

type SimpleType = 'boolean' | 'number' | 'null'

class BasicWrapper<K extends SimpleType, V, A> {
  type: K
  value: V
  annotation: A

  constructor(type: K, value: V, annotation: A) {
    this.type = type
    this.value = value
    this.annotation = annotation
  }
}

class StringWrapper<A> implements StringInput<A> {
  type = 'string' as const
  value: string
  annotation: A

  constructor(value: string, annotation: A) {
    this.value = value
    this.annotation = annotation
  }

  sliceAnnotation(start: number, end: number): {text: string; annotation: A}[] {
    return [{text: this.value.slice(start, end), annotation: this.annotation}]
  }
}

class ArrayWrapper<A> implements ArrayInput<A> {
  type = 'array' as const
  length: number
  value: unknown[]
  annotation: A

  private elements: Input<A>[] = []

  constructor(value: unknown[], annotation: A) {
    this.annotation = annotation
    this.value = value
    this.length = value.length
  }

  at(idx: number): Input<A> {
    if (idx >= this.length) throw new Error('out of bounds')
    const input = this.elements[idx]
    if (input) {
      return input
    }

    return (this.elements[idx] = wrap(this.value[idx], this.annotation))
  }

  annotationAt(): A {
    return this.annotation
  }
}

class ObjectWrapper<A> implements ObjectInput<A> {
  type = 'object' as const
  value: Record<string, unknown>
  keys: string[]
  annotation: A

  private fields: Record<string, Input<A>> = {}

  constructor(value: Record<string, unknown>, annotation: A) {
    this.value = filterUndefinedEntries(value)
    this.annotation = annotation
    this.keys = Object.keys(this.value)
  }

  get(key: string): Input<A> | undefined {
    const input = this.fields[key]
    if (input) {
      return input
    }

    if (!this.value.hasOwnProperty(key)) {
      return undefined
    }

    const raw = this.value[key]
    return (this.fields[key] = wrap(raw, this.annotation))
  }
}

function filterUndefinedEntries(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => typeof entryValue !== 'undefined'),
  )
}

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
