import {
  Input,
  ArrayInput,
  ObjectInput,
  StringInput,
  wrap,
  Diff,
  diffInput,
  NoDiff
} from '@sanity/diff'
import {Value, ArrayContent, ObjectContent, StringContent} from 'mendoza/lib/incremental-patcher'
import {Chunk, Annotation} from './types'

export type Meta = Chunk | null

export type Accessor = 'startMeta' | 'endMeta'

function reverseAccessor(accessor: Accessor): Accessor {
  return accessor === 'startMeta' ? 'endMeta' : 'startMeta'
}

class ArrayContentWrapper implements ArrayInput<Annotation> {
  type: 'array' = 'array'
  value: unknown[]
  length: number
  annotation: Annotation
  accessor: Accessor

  private content: ArrayContent<Meta>
  private elements: Input<Annotation>[] = []

  constructor(
    content: ArrayContent<Meta>,
    value: unknown[],
    annotation: Annotation,
    accessor: Accessor
  ) {
    this.content = content
    this.value = value
    this.annotation = annotation
    this.accessor = accessor
    this.length = content.elements.length
  }

  at(idx: number) {
    if (idx >= this.length) throw new Error('out of bounds')
    const input = this.elements[idx]
    if (input) {
      return input
    }
    return (this.elements[idx] = wrapValue(
      this.content.elements[idx],
      this.value[idx],
      this.accessor
    ))
  }
}

class ObjectContentWrapper implements ObjectInput<Annotation> {
  type: 'object' = 'object'
  value: object
  keys: string[]
  annotation: Annotation
  accessor: Accessor

  private content: ObjectContent<Meta>
  private fields: Record<string, Input<Meta>> = {}

  constructor(
    content: ObjectContent<Meta>,
    value: object,
    annotation: Annotation,
    accessor: Accessor
  ) {
    this.content = content
    this.value = value
    this.annotation = annotation
    this.accessor = accessor
    this.keys = Object.keys(content.fields)
  }

  get(key: string) {
    const input = this.fields[key]
    if (input) {
      return input
    }
    const value = this.content.fields[key]
    if (!value) return undefined
    return (this.fields[key] = wrapValue(value, this.value[key], this.accessor))
  }
}

class StringContentWrapper implements StringInput<Annotation> {
  type: 'string' = 'string'
  value: string
  annotation: Annotation
  accessor: Accessor

  private content: StringContent<Meta>
  private _data?: string

  constructor(
    content: StringContent<Meta>,
    value: string,
    annotation: Annotation,
    accessor: Accessor
  ) {
    this.content = content
    this.value = value
    this.annotation = annotation
    this.accessor = accessor
  }

  sliceAnnotation(start: number, end: number): {text: string; annotation: Annotation}[] {
    const result: {text: string; annotation: Annotation}[] = []
    let idx = 0

    for (const part of this.content.parts) {
      const length = part.value.length

      const subStart = Math.max(0, start - idx)
      if (subStart < length) {
        // The start of the slice is inside this part somewhere.

        // Figure out where the end is:
        const subEnd = Math.min(length, end - idx)

        // If the end of the slice is before this part, then we're guaranteed
        // that there are no more parts.
        // eslint-disable-next-line max-depth
        if (subEnd <= 0) break

        result.push({
          text: part.value.slice(subStart, subEnd),
          annotation: part[this.accessor]
        })
      }

      idx += length
    }

    return result
  }
}

function wrapValue(value: Value<Meta>, raw: unknown, accessor: Accessor): Input<Annotation> {
  const annotation = value[accessor]

  if (value.content) {
    switch (value.content.type) {
      case 'array':
        return new ArrayContentWrapper(value.content, raw as unknown[], annotation, accessor)
      case 'object':
        return new ObjectContentWrapper(value.content, raw as object, annotation, accessor)
      case 'string':
        return new StringContentWrapper(value.content, raw as string, annotation, accessor)
      default:
      // do nothing
    }
  }

  return wrap(raw, annotation)
}

export function diffValue(
  from: Value<Meta>,
  fromRaw: unknown,
  to: Value<Meta>,
  toRaw: unknown
): Diff<Annotation> | NoDiff {
  const fromInput = wrapValue(from, fromRaw, 'endMeta')
  const toInput = wrapValue(to, toRaw, 'startMeta')
  return diffInput(fromInput, toInput)
}
