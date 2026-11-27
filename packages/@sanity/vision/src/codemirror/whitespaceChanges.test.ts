import {ChangeSet, EditorSelection, Text} from '@codemirror/state'
import {describe, expect, it} from 'vitest'

import {whitespaceChanges} from './whitespaceChanges'

function apply(from: string, to: string) {
  return ChangeSet.of(whitespaceChanges(from, to), from.length)
}

describe('whitespaceChanges', () => {
  it('turns a text into another one', () => {
    const pairs: [string, string][] = [
      ['', ''],
      ['', '*'],
      ['*[a==b]', '*[a == b]'],
      ['*[a == b] {\n  x,\n  y\n}', '*[a == b] { x, y }'],
      ['  *  ', '*'],
      ['*[a]', '*[b]'],
      ['count(*)', 'count(*[_type == "x"])'],
    ]
    for (const [from, to] of pairs) {
      expect(
        apply(from, to)
          .apply(Text.of(from.split('\n')))
          .toString(),
      ).toBe(to)
    }
  })

  it('replaces each differing run of whitespace on its own when only whitespace differs', () => {
    expect(whitespaceChanges('*[a == b] {\n  x,\n  y\n}', '*[a == b] { x, y }')).toEqual([
      {from: 11, to: 14, insert: ' '},
      {from: 16, to: 19, insert: ' '},
      {from: 20, to: 21, insert: ' '},
    ])
    expect(whitespaceChanges('*[a==b]', '*[a == b]')).toEqual([
      {from: 3, to: 3, insert: ' '},
      {from: 5, to: 5, insert: ' '},
    ])
    expect(whitespaceChanges('*[a]', '*[a]')).toEqual([])
  })

  it('keeps a cursor on its token when the whitespace around it changes', () => {
    const from = '*[a == b] {\n  title,\n  slug\n}'
    const to = '*[a == b] { title, slug }'
    const cursor = from.indexOf('slug') + 2
    const mapped = EditorSelection.cursor(cursor).map(apply(from, to))
    expect(to.slice(mapped.from - 2, mapped.from + 2)).toBe('slug')
  })

  it('replaces what lies between the common start and end when tokens differ', () => {
    expect(whitespaceChanges('*[a] {x}', '*[b] {x}')).toEqual([{from: 2, to: 3, insert: 'b'}])
  })
})
