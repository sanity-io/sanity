import {ChangeSet, Text} from '@codemirror/state'
import {describe, expect, it} from 'vitest'

import {textChanges} from './textChanges'

function apply(from: string, to: string): string {
  return ChangeSet.of(textChanges(from, to), from.length)
    .apply(Text.of(from.split('\n')))
    .toString()
}

describe('textChanges', () => {
  it('turns one text into the other', () => {
    for (const [from, to] of [
      ['', '*'],
      ['*[_type == "post"]', ''],
      ['*[_type == "post"]', '*[_type == "article"]{title}'],
      ['count(*)', 'count(*[_type == "post"]) > 3'],
      ['{"a": 1}', '{"b": 2, "a": 10}'],
    ]) {
      expect(apply(from, to)).toBe(to)
    }
  })

  it('replaces only the characters that changed', () => {
    expect(textChanges('*[_type == "post"]{title}', '*[_type == "posts"]{title, slug}')).toEqual([
      {from: 16, to: 16, insert: 's'},
      {from: 24, to: 24, insert: ', slug'},
    ])
    expect(textChanges('same', 'same')).toEqual([])
  })
})
