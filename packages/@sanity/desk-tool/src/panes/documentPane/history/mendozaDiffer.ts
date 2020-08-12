import {Input, ArrayInput, ObjectInput, StringInput, wrap, Diff, diffInput} from '@sanity/diff'
import {Value, ArrayContent, ObjectContent, StringContent} from 'mendoza/lib/incremental-patcher'
import {Chunk, Annotation} from './types'
import {Timeline} from './timeline'
import {isSameAnnotation} from './utilts'

export type Meta = {chunk: Chunk; chunkIndex: number; transactionIndex: number} | null

export type AnnotationExtractor = (value: Value<Meta>) => Annotation

class ArrayContentWrapper implements ArrayInput<Annotation> {
  type: 'array' = 'array'
  value: unknown[]
  length: number
  annotation: Annotation
  extractor: AnnotationExtractor

  private content: ArrayContent<Meta>
  private elements: Input<Annotation>[] = []

  constructor(
    content: ArrayContent<Meta>,
    value: unknown[],
    annotation: Annotation,
    extractor: AnnotationExtractor
  ) {
    this.content = content
    this.value = value
    this.annotation = annotation
    this.extractor = extractor
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
      this.extractor
    ))
  }
}

class ObjectContentWrapper implements ObjectInput<Annotation> {
  type: 'object' = 'object'
  value: Record<string, unknown>
  keys: string[]
  annotation: Annotation
  extractor: AnnotationExtractor

  private content: ObjectContent<Meta>
  private fields: Record<string, Input<Annotation>> = {}

  constructor(
    content: ObjectContent<Meta>,
    value: Record<string, unknown>,
    annotation: Annotation,
    extractor: AnnotationExtractor
  ) {
    this.content = content
    this.value = value
    this.annotation = annotation
    this.extractor = extractor
    this.keys = Object.keys(content.fields)
  }

  get(key: string) {
    const input = this.fields[key]
    if (input) {
      return input
    }
    const value = this.content.fields[key]
    if (!value) return undefined
    return (this.fields[key] = wrapValue(value, this.value[key], this.extractor))
  }
}

class StringContentWrapper implements StringInput<Annotation> {
  type: 'string' = 'string'
  value: string
  annotation: Annotation
  extractor: AnnotationExtractor

  private content: StringContent<Meta>

  constructor(
    content: StringContent<Meta>,
    value: string,
    annotation: Annotation,
    extractor: AnnotationExtractor
  ) {
    this.content = content
    this.value = value
    this.annotation = annotation
    this.extractor = extractor
  }

  sliceAnnotation(start: number, end: number): {text: string; annotation: Annotation}[] {
    const result: {text: string; annotation: Annotation}[] = []
    let idx = 0

    function push(text: string, annotation: Annotation) {
      if (result.length > 0) {
        const lst = result[result.length - 1]
        if (isSameAnnotation(lst.annotation, annotation)) {
          lst.text += text
          return
        }
      }

      result.push({text, annotation})
    }

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

        push(part.value.slice(subStart, subEnd), this.extractor(part))
      }

      idx += length
    }

    return result
  }
}

function wrapValue(
  value: Value<Meta>,
  raw: unknown,
  extractor: AnnotationExtractor
): Input<Annotation> {
  const annotation = extractor(value)

  if (value.content) {
    switch (value.content.type) {
      case 'array':
        return new ArrayContentWrapper(value.content, raw as unknown[], annotation, extractor)
      case 'object':
        return new ObjectContentWrapper(
          value.content,
          raw as Record<string, unknown>,
          annotation,
          extractor
        )
      case 'string':
        return new StringContentWrapper(value.content, raw as string, annotation, extractor)
      default:
      // do nothing
    }
  }

  return wrap(raw, annotation)
}

function extractAnnotationForFromInput(timeline: Timeline, value: Value<Meta>): Annotation {
  if (value.endMeta) {
    // The next transaction is where it disappeared:
    const nextTxIndex = value.endMeta.transactionIndex + 1
    const tx = timeline.transactionByIndex(nextTxIndex)
    if (!tx) return null

    const chunk = timeline.chunkByTransactionIndex(nextTxIndex, value.endMeta.chunkIndex)

    return {
      chunk,
      author: tx.author
    }
  }

  return null
}

function extractAnnotationForToInput(timeline: Timeline, value: Value<Meta>): Annotation {
  if (value.startMeta) {
    const tx = timeline.transactionByIndex(value.startMeta.transactionIndex)!

    return {
      chunk: value.startMeta.chunk,
      author: tx.author
    }
  }

  return null
}

export function diffValue(
  timeline: Timeline,
  from: Value<Meta>,
  fromRaw: unknown,
  to: Value<Meta>,
  toRaw: unknown
): Diff<Annotation> {
  const fromInput = wrapValue(from, fromRaw, value =>
    extractAnnotationForFromInput(timeline, value)
  )
  const toInput = wrapValue(to, toRaw, value => extractAnnotationForToInput(timeline, value))
  return diffInput(fromInput, toInput)
}
