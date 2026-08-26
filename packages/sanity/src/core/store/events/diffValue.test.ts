import {type StringInput} from '@sanity/diff'
import {incremental} from 'mendoza'
import {describe, expect, it} from 'vitest'

import {type Annotation, type ObjectDiff} from '../../field/types'
import {minutesAfterBase, publishDocumentVersionEvent} from './__fixtures__/events.fixture'
import {DRAFT_ID, editTransaction} from './__fixtures__/transactions.fixture'
import {type AnnotationExtractor, diffValue, type EventMeta, wrapValue} from './diffValue'

describe('diffValue', () => {
  const doc0 = {_id: DRAFT_ID, _type: 'author', name: 'v0', role: 'developer'}
  const doc1 = {_id: DRAFT_ID, _type: 'author', name: 'v1', role: 'developer'}
  const doc2 = {_id: DRAFT_ID, _type: 'author', name: 'v2'}

  const tx0 = editTransaction({id: 'tx-0', author: 'author-a', timestamp: minutesAfterBase(0)})
  const tx1 = editTransaction({id: 'tx-1', author: 'author-b', timestamp: minutesAfterBase(1)})
  const transactions = [tx0, tx1]

  const initial = incremental.wrap<EventMeta>(doc0, null)
  const afterTx0 = incremental.applyPatch(initial, [0, doc1], {transactionIndex: 0})
  const afterTx1 = incremental.applyPatch(afterTx0, [0, doc2], {transactionIndex: 1})

  it('annotates changed values with the transaction that introduced them (to side)', () => {
    const diff = diffValue({
      transactions,
      fromValue: initial,
      fromRaw: doc0,
      toValue: afterTx1,
      toRaw: doc2,
    }) as ObjectDiff

    expect(diff.isChanged).toBe(true)
    expect(diff.fields.name).toMatchObject({
      action: 'changed',
      fromValue: 'v0',
      toValue: 'v2',
      annotation: {author: 'author-b', timestamp: tx1.timestamp},
    })
  })

  it('annotates removals: null meta falls back to the first transaction in the range', () => {
    // The from side is the initially wrapped document (null metas), so the removal of `role`
    // is attributed to transactions[0] even though tx1 removed it.
    const diff = diffValue({
      transactions,
      fromValue: initial,
      fromRaw: doc0,
      toValue: afterTx1,
      toRaw: doc2,
    }) as ObjectDiff

    expect(diff.fields.role).toMatchObject({
      action: 'removed',
      annotation: {author: 'author-a', timestamp: tx0.timestamp},
    })
  })

  it('annotates removals with the transaction *after* the recorded meta (where the value disappeared)', () => {
    // Diffing from the state after tx0: `role` carries endMeta {transactionIndex: 0}, so the
    // removal is attributed to transactions[0 + 1] = tx1.
    const diff = diffValue({
      transactions,
      fromValue: afterTx0,
      fromRaw: doc1,
      toValue: afterTx1,
      toRaw: doc2,
    }) as ObjectDiff

    expect(diff.fields.role).toMatchObject({
      action: 'removed',
      annotation: {author: 'author-b', timestamp: tx1.timestamp},
    })
  })

  it('propagates the event recorded in the transaction meta into annotations', () => {
    const publishEvent = publishDocumentVersionEvent({revisionId: 'tx-1'})
    const withEvent = incremental.applyPatch(afterTx0, [0, doc2], {
      transactionIndex: 1,
      event: publishEvent,
    })

    const diff = diffValue({
      transactions,
      fromValue: afterTx0,
      fromRaw: doc1,
      toValue: withEvent,
      toRaw: doc2,
    }) as ObjectDiff

    expect(diff.fields.name).toMatchObject({
      action: 'changed',
      annotation: {author: 'author-b', event: publishEvent},
    })
  })

  it('produces an unchanged diff when nothing happened', () => {
    const diff = diffValue({
      transactions: [],
      fromValue: initial,
      fromRaw: doc0,
      toValue: initial,
      toRaw: doc0,
    }) as ObjectDiff

    expect(diff.action).toBe('unchanged')
    expect(diff.isChanged).toBe(false)
  })
})

const stringPart = (value: string, meta: Annotation) => ({
  value,
  utf8size: value.length,
  uses: [],
  startMeta: meta,
  endMeta: meta,
})

describe('wrapValue', () => {
  const annotationA: Annotation = {author: 'author-a', timestamp: minutesAfterBase(0)}
  const annotationB: Annotation = {author: 'author-b', timestamp: minutesAfterBase(1)}

  // Metas *are* annotations in these tests, so the extractor is the identity.
  const extractor: AnnotationExtractor<Annotation> = {
    fromValue: (value) => value.endMeta,
    fromMeta: (meta) => meta,
  }

  it('wraps values without content through @sanity/diff wrap, keeping the annotation', () => {
    const input = wrapValue({data: 42, startMeta: annotationA, endMeta: annotationA}, 42, extractor)

    expect(input.type).toBe('number')
    expect(input.value).toBe(42)
    expect(input.annotation).toEqual(annotationA)
  })

  it('object content: exposes keys, wraps fields lazily with caching, undefined for missing keys', () => {
    const titleValue = {data: 'hello', startMeta: annotationB, endMeta: annotationB}
    const input = wrapValue(
      {
        startMeta: annotationA,
        endMeta: annotationA,
        content: {type: 'object', fields: {title: titleValue}},
      },
      {title: 'hello'},
      extractor,
    )

    if (input.type !== 'object') throw new Error('expected object input')
    expect(input.keys).toEqual(['title'])
    const title = input.get('title')
    expect(title).toMatchObject({type: 'string', value: 'hello', annotation: annotationB})
    expect(input.get('title')).toBe(title)
    expect(input.get('missing')).toBeUndefined()
  })

  it('array content: wraps elements lazily, exposes per-index metas, throws out of bounds', () => {
    const elements = [
      {data: 'first', startMeta: annotationA, endMeta: annotationA},
      {data: 'second', startMeta: annotationB, endMeta: annotationB},
    ]
    const input = wrapValue(
      {
        startMeta: annotationA,
        endMeta: annotationA,
        content: {type: 'array', elements, metas: [annotationA, annotationB]},
      },
      ['first', 'second'],
      extractor,
    )

    if (input.type !== 'array') throw new Error('expected array input')
    expect(input.length).toBe(2)
    const first = input.at(0)
    expect(first).toMatchObject({type: 'string', value: 'first', annotation: annotationA})
    expect(input.at(0)).toBe(first)
    expect(input.annotationAt(1)).toEqual(annotationB)
    expect(() => input.at(2)).toThrow('out of bounds')
  })

  describe('string content sliceAnnotation', () => {
    const input = wrapValue(
      {
        startMeta: annotationA,
        endMeta: annotationA,
        content: {
          type: 'string',
          parts: [
            stringPart('Hello ', annotationA),
            stringPart('wor', annotationA),
            stringPart('ld', annotationB),
          ],
        },
      },
      'Hello world',
      extractor,
    ) as StringInput<Annotation>

    it('merges adjacent segments with the same annotation', () => {
      expect(input.sliceAnnotation(0, 11)).toEqual([
        {text: 'Hello wor', annotation: annotationA},
        {text: 'ld', annotation: annotationB},
      ])
    })

    it('slices across part boundaries', () => {
      expect(input.sliceAnnotation(6, 9)).toEqual([{text: 'wor', annotation: annotationA}])
      expect(input.sliceAnnotation(8, 11)).toEqual([
        {text: 'r', annotation: annotationA},
        {text: 'ld', annotation: annotationB},
      ])
    })
  })
})
