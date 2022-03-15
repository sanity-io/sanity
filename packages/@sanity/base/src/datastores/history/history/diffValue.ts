import {incremental} from 'mendoza'
import {Input, ArrayInput, ObjectInput, StringInput, wrap, Diff, diffInput} from '@sanity/diff'
import {Chunk, Annotation} from '../../../field'
import {Timeline} from './Timeline'
import {isSameAnnotation} from './utils'

export type Meta = {chunk: Chunk; transactionIndex: number} | null

export type AnnotationExtractor = {
  fromValue(value: incremental.Value<Meta>): Annotation
  fromMeta(meta: Meta): Annotation
}

class ArrayContentWrapper implements ArrayInput<Annotation> {
  type: 'array' = 'array'
  value: unknown[]
  length: number
  annotation: Annotation
  extractor: AnnotationExtractor

  private content: incremental.ArrayContent<Meta>
  private elements: Input<Annotation>[] = []

  constructor(
    content: incremental.ArrayContent<Meta>,
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

  annotationAt(idx: number): Annotation {
    const meta = this.content.metas[idx]
    return this.extractor.fromMeta(meta)
  }
}

class ObjectContentWrapper implements ObjectInput<Annotation> {
  type: 'object' = 'object'
  value: Record<string, unknown>
  keys: string[]
  annotation: Annotation
  extractor: AnnotationExtractor

  private content: incremental.ObjectContent<Meta>
  private fields: Record<string, Input<Annotation>> = {}

  constructor(
    content: incremental.ObjectContent<Meta>,
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

  private content: incremental.StringContent<Meta>

  constructor(
    content: incremental.StringContent<Meta>,
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
        if (subEnd <= 0) break

        push(part.value.slice(subStart, subEnd), this.extractor.fromValue(part))
      }

      idx += length
    }

    return result
  }
}

function wrapValue(
  value: incremental.Value<Meta>,
  raw: unknown,
  extractor: AnnotationExtractor
): Input<Annotation> {
  const annotation = extractor.fromValue(value)

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

function extractAnnotationForFromInput(
  timeline: Timeline,
  firstChunk: Chunk | null,
  meta: Meta
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
  toRaw: unknown
): Diff<Annotation> {
  const fromInput = wrapValue(from, fromRaw, {
    fromValue(value) {
      return extractAnnotationForFromInput(timeline, firstChunk, value.endMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForFromInput(timeline, firstChunk, meta)
    },
  })

  const toInput = wrapValue(to, toRaw, {
    fromValue(value) {
      return extractAnnotationForToInput(timeline, value.startMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForToInput(timeline, meta)
    },
  })
  return diffInput(fromInput, toInput)
}
