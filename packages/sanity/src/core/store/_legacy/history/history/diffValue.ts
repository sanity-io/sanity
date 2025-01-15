import {
  type ArrayInput,
  type Diff,
  diffInput,
  type Input,
  type ObjectInput,
  type StringInput,
  wrap,
} from '@sanity/diff'
import {type incremental} from 'mendoza'

import {type Annotation, type Chunk} from '../../../../field'
import {type Timeline} from './Timeline'
import {isSameAnnotation} from './utils'

export type Meta = {chunk: Chunk; transactionIndex: number} | null

export type AnnotationExtractor<T> = {
  fromValue(value: incremental.Value<T>): Annotation
  fromMeta(meta: T): Annotation
}

class ArrayContentWrapper<T> implements ArrayInput<Annotation> {
  type = 'array' as const
  value: unknown[]
  length: number
  annotation: Annotation
  extractor: AnnotationExtractor<T>

  private content: incremental.ArrayContent<T>
  private elements: Input<Annotation>[] = []

  constructor(
    content: incremental.ArrayContent<T>,
    value: unknown[],
    annotation: Annotation,
    extractor: AnnotationExtractor<T>,
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
      this.extractor,
    ))
  }

  annotationAt(idx: number): Annotation {
    const meta = this.content.metas[idx]
    return this.extractor.fromMeta(meta)
  }
}

class ObjectContentWrapper<T> implements ObjectInput<Annotation> {
  type = 'object' as const
  value: Record<string, unknown>
  keys: string[]
  annotation: Annotation
  extractor: AnnotationExtractor<T>

  private content: incremental.ObjectContent<T>
  private fields: Record<string, Input<Annotation>> = {}

  constructor(
    content: incremental.ObjectContent<T>,
    value: Record<string, unknown>,
    annotation: Annotation,
    extractor: AnnotationExtractor<T>,
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

class StringContentWrapper<T> implements StringInput<Annotation> {
  type = 'string' as const
  value: string
  annotation: Annotation
  extractor: AnnotationExtractor<T>

  private content: incremental.StringContent<T>

  constructor(
    content: incremental.StringContent<T>,
    value: string,
    annotation: Annotation,
    extractor: AnnotationExtractor<T>,
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
        if (subEnd <= 0) break

        push(part.value.slice(subStart, subEnd), this.extractor.fromValue(part))
      }

      idx += length
    }

    return result
  }
}

export function wrapValue<T>(
  value: incremental.Value<T>,
  raw: unknown,
  extractor: AnnotationExtractor<T>,
): Input<Annotation> {
  const annotation = extractor.fromValue(value)

  if (value.content) {
    switch (value.content.type) {
      case 'array':
        return new ArrayContentWrapper<T>(value.content, raw as unknown[], annotation, extractor)
      case 'object':
        return new ObjectContentWrapper<T>(
          value.content,
          raw as Record<string, unknown>,
          annotation,
          extractor,
        )
      case 'string':
        return new StringContentWrapper<T>(value.content, raw as string, annotation, extractor)
      default:
      // do nothing
    }
  }

  return wrap(raw, annotation)
}

function extractAnnotationForFromInput(
  timeline: Timeline,
  firstChunk: Chunk | null,
  meta: Meta,
): Annotation {
  if (meta) {
    // The next transaction is where it disappeared:
    return annotationForTransactionIndex(timeline, meta.transactionIndex + 1, meta.chunk.index)
  } else if (firstChunk) {
    return annotationForTransactionIndex(timeline, firstChunk.start, firstChunk.index)
  }

  return null
}

function extractAnnotationForToInput(timeline: Timeline, meta: Meta): Annotation {
  if (meta) {
    return annotationForTransactionIndex(timeline, meta.transactionIndex, meta.chunk.index)
  }

  return null
}

function annotationForTransactionIndex(timeline: Timeline, idx: number, chunkIdx?: number) {
  const tx = timeline.transactionByIndex(idx)
  if (!tx) return null

  const chunk = timeline.chunkByTransactionIndex(idx, chunkIdx)
  if (!chunk) return null

  return {
    chunk,
    timestamp: tx.timestamp,
    author: tx.author,
  }
}

// eslint-disable-next-line max-params
export function diffValue(
  timeline: Timeline,
  firstChunk: Chunk | null,
  from: incremental.Value<Meta>,
  fromRaw: unknown,
  to: incremental.Value<Meta>,
  toRaw: unknown,
): Diff<Annotation> {
  const fromInput = wrapValue<Meta>(from, fromRaw, {
    fromValue(value) {
      return extractAnnotationForFromInput(timeline, firstChunk, value.endMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForFromInput(timeline, firstChunk, meta)
    },
  })

  const toInput = wrapValue<Meta>(to, toRaw, {
    fromValue(value) {
      return extractAnnotationForToInput(timeline, value.startMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForToInput(timeline, meta)
    },
  })
  return diffInput(fromInput, toInput)
}
