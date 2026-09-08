/* oxlint-disable no-deprecated -- this module implements the deprecated legacy document timeline */
import {type Diff, diffInput} from '@sanity/diff'
import {type incremental} from 'mendoza'

import {type Annotation, type Chunk} from '../../../field/types'
import {wrapValue} from '../../events/diffValue'
import {type Timeline} from './Timeline'

/**
 * @deprecated
 */
export type Meta = {chunk: Chunk; transactionIndex: number} | null

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

// oxlint-disable-next-line no-deprecated -- part of the deprecated legacy document timeline
function extractAnnotationForToInput(timeline: Timeline, meta: Meta): Annotation {
  if (meta) {
    return annotationForTransactionIndex(timeline, meta.transactionIndex, meta.chunk.index)
  }

  return null
}

// oxlint-disable-next-line no-deprecated -- part of the deprecated legacy document timeline
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

/**
 * @deprecated use the events api diff value with support for transactions instead.
 */
export function diffValue(
  // oxlint-disable-next-line no-deprecated -- part of the deprecated legacy document timeline
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
