import {type Path} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {ROOT_KEY} from '../helpers'
import {
  fromSyntheticPath,
  isFieldPathInsideCell,
  isSpanTextPath,
  SYNTHETIC_ROOT_SEGMENT,
  toSyntheticPath,
} from './pathBridge'

describe('spike-r1 pathBridge', () => {
  describe('toSyntheticPath', () => {
    it('prepends the synthetic root segment to a deep field path', () => {
      const fieldPath: Path = ['rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value', {_key: 'b1'}]
      expect(toSyntheticPath(fieldPath)).toEqual([
        {_key: ROOT_KEY},
        'rows',
        {_key: 'r1'},
        'cells',
        {_key: 'c1'},
        'value',
        {_key: 'b1'},
      ])
    })

    it('maps the empty (field-level) path to the block itself', () => {
      expect(toSyntheticPath([])).toEqual([{_key: ROOT_KEY}])
    })

    it('uses the shared synthetic root segment', () => {
      expect(toSyntheticPath([])[0]).toEqual(SYNTHETIC_ROOT_SEGMENT)
    })
  })

  describe('fromSyntheticPath', () => {
    it('strips the synthetic root segment from a deep array path', () => {
      const syntheticPath: Path = [{_key: ROOT_KEY}, 'rows', {_key: 'r1'}, 'cells', {_key: 'c1'}]
      expect(fromSyntheticPath(syntheticPath)).toEqual([
        'rows',
        {_key: 'r1'},
        'cells',
        {_key: 'c1'},
      ])
    })

    it('maps the block-only path to the empty field path', () => {
      expect(fromSyntheticPath([{_key: ROOT_KEY}])).toEqual([])
    })

    it('returns null for a foreign block key', () => {
      expect(fromSyntheticPath([{_key: 'someOtherBlock'}, 'rows'])).toBeNull()
    })

    it('returns null for an empty (whole-value) path', () => {
      expect(fromSyntheticPath([])).toBeNull()
    })

    it('returns null for a non-keyed leading segment', () => {
      expect(fromSyntheticPath(['rows', {_key: 'r1'}])).toBeNull()
    })
  })

  describe('round-trip identity', () => {
    const fieldPaths: Path[] = [
      [],
      ['rows'],
      ['rows', {_key: 'r1'}],
      ['rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value', {_key: 'b1'}],
      // A span text focusPath, the shape PortableTextInput reports for a caret
      // inside editable cell text.
      [
        'rows',
        {_key: 'r1'},
        'cells',
        {_key: 'c1'},
        'value',
        {_key: 'b1'},
        'children',
        {_key: 's1'},
        'text',
      ],
    ]

    // Wrap each path in a tuple so `it.each` passes the whole array as a single
    // argument rather than spreading its segments across parameters.
    it.each(fieldPaths.map((p) => [p] as const))(
      'field -> synthetic -> field is identity for %j',
      (fieldPath) => {
        expect(fromSyntheticPath(toSyntheticPath(fieldPath))).toEqual(fieldPath)
      },
    )

    it.each(fieldPaths.map((p) => [p] as const))(
      'synthetic -> field -> synthetic is identity for %j',
      (fieldPath) => {
        const syntheticPath = toSyntheticPath(fieldPath)
        const back = fromSyntheticPath(syntheticPath)
        expect(back).not.toBeNull()
        expect(toSyntheticPath(back as Path)).toEqual(syntheticPath)
      },
    )
  })

  describe('isSpanTextPath', () => {
    it('is true for a path ending in text', () => {
      expect(isSpanTextPath(['rows', {_key: 'r1'}, 'children', {_key: 's1'}, 'text'])).toBe(true)
    })

    it('is false for a block/cell path', () => {
      expect(isSpanTextPath(['rows', {_key: 'r1'}])).toBe(false)
    })

    it('is false for an empty path', () => {
      expect(isSpanTextPath([])).toBe(false)
    })

    it('survives a synthetic round-trip', () => {
      const fieldPath: Path = [
        'rows',
        {_key: 'r1'},
        'value',
        {_key: 'b1'},
        'children',
        {_key: 's1'},
        'text',
      ]
      const back = fromSyntheticPath(toSyntheticPath(fieldPath))
      expect(back).not.toBeNull()
      expect(isSpanTextPath(back as Path)).toBe(true)
    })
  })

  describe('isFieldPathInsideCell', () => {
    it('is true for a path into a cell value array', () => {
      expect(
        isFieldPathInsideCell(['rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value', {_key: 'b1'}]),
      ).toBe(true)
    })

    it('is false for a row/table level path', () => {
      expect(isFieldPathInsideCell(['rows', {_key: 'r1'}, 'cells', {_key: 'c1'}])).toBe(false)
    })

    it('is false when value is not preceded by a keyed (cell) segment', () => {
      expect(isFieldPathInsideCell(['value', {_key: 'b1'}])).toBe(false)
    })

    it('is false for undefined', () => {
      expect(isFieldPathInsideCell(undefined)).toBe(false)
    })
  })
})
