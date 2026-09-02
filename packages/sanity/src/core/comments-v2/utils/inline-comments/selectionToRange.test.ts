import {type EditorSelection} from '@portabletext/editor'
import {describe, expect, test} from 'vitest'

import {selectionsToRange, selectionToRange} from './selectionToRange'

const block = {
  _type: 'block',
  _key: 'b1',
  children: [
    {_type: 'span', _key: 's1', text: 'Hello '},
    {_type: 'span', _key: 's2', text: 'world'},
  ],
}

const multiBlock = [
  {
    _type: 'block',
    _key: 'b1',
    children: [{_type: 'span', _key: 's1', text: 'First block'}],
  },
  {
    _type: 'block',
    _key: 'b2',
    children: [{_type: 'span', _key: 's2', text: 'Second block'}],
  },
]

describe('comments: selectionToRange', () => {
  test('converts single-span selection to block-relative offsets', () => {
    const selection: EditorSelection = {
      anchor: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 0},
      focus: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 5},
    }

    const range = selectionToRange(selection, [block])

    expect(range).toEqual({
      start: {_key: 'b1', offset: 0},
      end: {_key: 'b1', offset: 5},
    })
  })

  test('adjusts offset for second span', () => {
    const selection: EditorSelection = {
      anchor: {path: [{_key: 'b1'}, 'children', {_key: 's2'}], offset: 0},
      focus: {path: [{_key: 'b1'}, 'children', {_key: 's2'}], offset: 5},
    }

    const range = selectionToRange(selection, [block])

    expect(range).toEqual({
      start: {_key: 'b1', offset: 6},
      end: {_key: 'b1', offset: 11},
    })
  })

  test('handles backward selection by normalizing', () => {
    const selection: EditorSelection = {
      backward: true,
      anchor: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 5},
      focus: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 0},
    }

    const range = selectionToRange(selection, [block])

    expect(range).toEqual({
      start: {_key: 'b1', offset: 0},
      end: {_key: 'b1', offset: 5},
    })
  })

  test('handles cross-block selection', () => {
    const selection: EditorSelection = {
      anchor: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 6},
      focus: {path: [{_key: 'b2'}, 'children', {_key: 's2'}], offset: 6},
    }

    const range = selectionToRange(selection, multiBlock)

    expect(range).toEqual({
      start: {_key: 'b1', offset: 6},
      end: {_key: 'b2', offset: 6},
    })
  })

  test('returns null for invalid selection path', () => {
    const selection: EditorSelection = {
      anchor: {path: [{_key: 'nonexistent'}, 'children', {_key: 's1'}], offset: 0},
      focus: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 5},
    }

    const range = selectionToRange(selection, [block])

    expect(range).toBeNull()
  })

  test('combines per-block selections into one range', () => {
    const first: EditorSelection = {
      anchor: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 6},
      focus: {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 11},
    }
    const second: EditorSelection = {
      anchor: {path: [{_key: 'b2'}, 'children', {_key: 's2'}], offset: 0},
      focus: {path: [{_key: 'b2'}, 'children', {_key: 's2'}], offset: 6},
    }

    expect(selectionsToRange([second, first], multiBlock)).toEqual({
      start: {_key: 'b1', offset: 6},
      end: {_key: 'b2', offset: 6},
    })
  })

  test('returns null when no selection resolves', () => {
    const invalid: EditorSelection = {
      anchor: {path: [{_key: 'missing'}, 'children', {_key: 's1'}], offset: 0},
      focus: {path: [{_key: 'missing'}, 'children', {_key: 's1'}], offset: 1},
    }

    expect(selectionsToRange([null], multiBlock)).toBeNull()
    expect(selectionsToRange([invalid], multiBlock)).toBeNull()
  })
})
